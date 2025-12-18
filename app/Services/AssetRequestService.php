<?php

namespace App\Services;

use App\Enums\ApprovalStatus;
use App\Enums\RequestStatus;
use App\Enums\RequestType;
use App\Models\Asset;
use App\Models\AssetRequest;
use App\Models\AssetRequestApproval;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AssetRequestService
{
    public function __construct(
        protected AssetMovementService $movementService
    ) {}

    /**
     * Create a new asset request
     */
    public function create(
        User $requester,
        RequestType $type,
        ?string $justification = null
    ): AssetRequest {
        return AssetRequest::create([
            'requester_id' => $requester->id,
            'request_type' => $type,
            'status' => RequestStatus::DRAFT,
            'justification' => $justification,
        ]);
    }

    /**
     * Submit request for approval
     */
    public function submit(AssetRequest $request): void
    {
        if (!$request->canSubmit()) {
            throw new \InvalidArgumentException(
                "Request cannot be submitted. Current status: {$request->status->label()}"
            );
        }

        if ($request->items()->count() === 0) {
            throw new \InvalidArgumentException('Request must have at least one item');
        }

        DB::transaction(function () use ($request) {
            $request->update(['status' => RequestStatus::SUBMITTED]);

            // Find approver (level >= 9, active)
            $approver = $this->findAvailableApprover();

            if (!$approver) {
                throw new \RuntimeException('No available approver found');
            }

            // Create approval record
            AssetRequestApproval::create([
                'request_id' => $request->id,
                'approver_id' => $approver->id,
                'status' => ApprovalStatus::PENDING,
                'sequence' => 1,
            ]);

            $request->update(['status' => RequestStatus::PENDING_APPROVAL]);

            // TODO: Send notification to approver
            // $approver->notify(new RequestPendingApproval($request));

            Log::channel('audit')->info('Request submitted', [
                'request_id' => $request->id,
                'request_number' => $request->request_number,
                'requester' => $request->requester_id,
                'approver' => $approver->id,
            ]);
        });
    }

    /**
     * Find an available approver
     * Uses workload balancing: picks approver with least pending approvals
     */
    protected function findAvailableApprover(): ?User
    {
        return User::where('id_level', '>=', 9)
            ->where('is_active', true)
            ->withCount(['approvals' => fn($q) => $q->where('status', ApprovalStatus::PENDING)])
            ->orderBy('approvals_count')
            ->first();
    }

    /**
     * Approve request
     */
    public function approve(
        AssetRequest $request,
        User $approver,
        ?string $remarks = null
    ): void {
        $approval = $request->approvals()
            ->where('approver_id', $approver->id)
            ->where('status', ApprovalStatus::PENDING)
            ->first();

        if (!$approval) {
            throw new \InvalidArgumentException('You are not authorized to approve this request');
        }

        DB::transaction(function () use ($request, $approval, $approver, $remarks) {
            // Update approval record
            $approval->approve($approver, $remarks);

            // Update request status
            $request->update(['status' => RequestStatus::APPROVED]);

            // TODO: Send notification to requester
            // $request->requester->notify(new RequestApproved($request));

            Log::channel('audit')->info('Request approved', [
                'request_id' => $request->id,
                'request_number' => $request->request_number,
                'approver' => $approver->id,
                'remarks' => $remarks,
            ]);
        });
    }

    /**
     * Reject request
     */
    public function reject(
        AssetRequest $request,
        User $approver,
        string $reason
    ): void {
        if (empty($reason)) {
            throw new \InvalidArgumentException('Rejection reason is required');
        }

        $approval = $request->approvals()
            ->where('approver_id', $approver->id)
            ->where('status', ApprovalStatus::PENDING)
            ->first();

        if (!$approval) {
            throw new \InvalidArgumentException('You are not authorized to reject this request');
        }

        DB::transaction(function () use ($request, $approval, $approver, $reason) {
            // Update approval record
            $approval->reject($approver, $reason);

            // Update request status
            $request->update([
                'status' => RequestStatus::REJECTED,
                'rejection_reason' => $reason,
            ]);

            // TODO: Send notification to requester
            // $request->requester->notify(new RequestRejected($request));

            Log::channel('audit')->info('Request rejected', [
                'request_id' => $request->id,
                'request_number' => $request->request_number,
                'approver' => $approver->id,
                'reason' => $reason,
            ]);
        });
    }

    /**
     * Fulfill request (Admin assigns assets from stock)
     *
     * @param AssetRequest $request The approved request
     * @param array $itemFulfillments Array of [item_id => asset_id] mappings
     * @param User $admin The admin performing fulfillment
     * @param string|null $notes Optional fulfillment notes
     */
    public function fulfill(
        AssetRequest $request,
        array $itemFulfillments,
        User $admin,
        ?string $notes = null
    ): void {
        if ($request->status !== RequestStatus::APPROVED) {
            throw new \InvalidArgumentException(
                "Only approved requests can be fulfilled. Current status: {$request->status->label()}"
            );
        }

        DB::transaction(function () use ($request, $itemFulfillments, $admin, $notes) {
            foreach ($itemFulfillments as $itemId => $assetId) {
                $item = $request->items()->findOrFail($itemId);
                $asset = Asset::findOrFail($assetId);

                // Validate asset can be assigned
                if (!$asset->canBeAssigned()) {
                    throw new \InvalidArgumentException(
                        "Asset {$asset->asset_tag} cannot be assigned. Status: {$asset->status->label()}"
                    );
                }

                // Assign asset via movement service (handles audit trail)
                $this->movementService->assign(
                    $asset,
                    $request->requester,
                    $admin,
                    $request,
                    $notes
                );

                // Update item with fulfilled asset
                $item->update(['fulfilled_asset_id' => $asset->id]);
            }

            // Update request status
            $request->update([
                'status' => RequestStatus::FULFILLED,
                'fulfilled_by' => $admin->id,
                'fulfilled_at' => now(),
                'fulfillment_notes' => $notes,
            ]);

            // TODO: Send notification to requester
            // $request->requester->notify(new RequestFulfilled($request));

            Log::channel('audit')->info('Request fulfilled', [
                'request_id' => $request->id,
                'request_number' => $request->request_number,
                'admin' => $admin->id,
                'assets_assigned' => $itemFulfillments,
            ]);
        });
    }

    /**
     * Cancel request
     */
    public function cancel(AssetRequest $request, User $user): void
    {
        if (!$request->canCancel()) {
            throw new \InvalidArgumentException(
                "Request cannot be cancelled. Current status: {$request->status->label()}"
            );
        }

        // Only requester can cancel their own request
        if ($request->requester_id !== $user->id && !$user->hasRole(['asset_admin', 'super_admin'])) {
            throw new \InvalidArgumentException('You are not authorized to cancel this request');
        }

        DB::transaction(function () use ($request, $user) {
            $request->update(['status' => RequestStatus::CANCELLED]);

            // Cancel any pending approvals
            $request->approvals()
                ->where('status', ApprovalStatus::PENDING)
                ->update([
                    'status' => ApprovalStatus::REJECTED,
                    'remarks' => 'Request cancelled by user',
                    'decided_by' => $user->id,
                    'decided_at' => now(),
                ]);

            Log::channel('audit')->info('Request cancelled', [
                'request_id' => $request->id,
                'request_number' => $request->request_number,
                'cancelled_by' => $user->id,
            ]);
        });
    }

    /**
     * Close a fulfilled request
     */
    public function close(AssetRequest $request, User $user): void
    {
        if ($request->status !== RequestStatus::FULFILLED) {
            throw new \InvalidArgumentException('Only fulfilled requests can be closed');
        }

        $request->update(['status' => RequestStatus::CLOSED]);

        Log::channel('audit')->info('Request closed', [
            'request_id' => $request->id,
            'request_number' => $request->request_number,
            'closed_by' => $user->id,
        ]);
    }

    /**
     * Handle return request fulfillment
     */
    public function fulfillReturn(
        AssetRequest $request,
        User $admin,
        ?int $locationId = null,
        ?string $notes = null
    ): void {
        if ($request->request_type !== RequestType::RETURN) {
            throw new \InvalidArgumentException('This is not a return request');
        }

        if ($request->status !== RequestStatus::APPROVED) {
            throw new \InvalidArgumentException('Request must be approved first');
        }

        DB::transaction(function () use ($request, $admin, $locationId, $notes) {
            foreach ($request->items as $item) {
                if (!$item->asset) {
                    continue;
                }

                // Return asset via movement service
                $this->movementService->return(
                    $item->asset,
                    $admin,
                    $locationId,
                    $notes
                );

                $item->update(['fulfilled_asset_id' => $item->asset_id]);
            }

            $request->update([
                'status' => RequestStatus::FULFILLED,
                'fulfilled_by' => $admin->id,
                'fulfilled_at' => now(),
                'fulfillment_notes' => $notes,
            ]);

            Log::channel('audit')->info('Return request fulfilled', [
                'request_id' => $request->id,
                'request_number' => $request->request_number,
                'admin' => $admin->id,
            ]);
        });
    }

    /**
     * Handle transfer request fulfillment
     */
    public function fulfillTransfer(
        AssetRequest $request,
        User $admin,
        ?string $notes = null
    ): void {
        if ($request->request_type !== RequestType::TRANSFER) {
            throw new \InvalidArgumentException('This is not a transfer request');
        }

        if ($request->status !== RequestStatus::APPROVED) {
            throw new \InvalidArgumentException('Request must be approved first');
        }

        DB::transaction(function () use ($request, $admin, $notes) {
            foreach ($request->items as $item) {
                if (!$item->asset || !$item->transferToUser) {
                    continue;
                }

                // Transfer asset via movement service
                $this->movementService->transfer(
                    $item->asset,
                    $item->transferToUser,
                    $admin,
                    $request,
                    $notes
                );

                $item->update(['fulfilled_asset_id' => $item->asset_id]);
            }

            $request->update([
                'status' => RequestStatus::FULFILLED,
                'fulfilled_by' => $admin->id,
                'fulfilled_at' => now(),
                'fulfillment_notes' => $notes,
            ]);

            Log::channel('audit')->info('Transfer request fulfilled', [
                'request_id' => $request->id,
                'request_number' => $request->request_number,
                'admin' => $admin->id,
            ]);
        });
    }
}
