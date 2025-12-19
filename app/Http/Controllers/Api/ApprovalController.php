<?php

namespace App\Http\Controllers\Api;

use App\Enums\ApprovalStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\AssetRequestResource;
use App\Models\AssetRequest;
use App\Models\AssetRequestApproval;
use App\Models\Notification;
use App\Services\AssetRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Log;

class ApprovalController extends Controller
{
    public function __construct(
        protected AssetRequestService $requestService
    ) {}

    /**
     * Get pending approvals for current user
     */
    public function pending(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $approvals = AssetRequestApproval::with([
                'request.requester',
                'request.items.category',
                'request.items.asset',
            ])
            ->where('approver_id', $user->id)
            ->where('status', ApprovalStatus::PENDING)
            ->orderBy('created_at')
            ->paginate($request->get('per_page', 15));

        // Transform to show the request with approval context
        return AssetRequestResource::collection(
            $approvals->through(fn($approval) => $approval->request)
        );
    }

    /**
     * Get approval history for current user
     */
    public function history(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $approvals = AssetRequestApproval::with(['request.requester'])
            ->where('approver_id', $user->id)
            ->whereIn('status', [ApprovalStatus::APPROVED, ApprovalStatus::REJECTED])
            ->orderByDesc('decided_at')
            ->paginate($request->get('per_page', 15));

        return AssetRequestResource::collection(
            $approvals->through(fn($approval) => $approval->request)
        );
    }

    /**
     * Approve a request
     */
    public function approve(Request $httpRequest, AssetRequest $request): JsonResponse
    {
        $this->authorize('approve', $request);

        $validated = $httpRequest->validate([
            'remarks' => 'nullable|string|max:1000',
        ]);

        $this->requestService->approve(
            $request,
            $httpRequest->user(),
            $validated['remarks'] ?? null
        );

        // Send notification to requester (don't fail approval if notification fails)
        try {
            \Log::info('Creating approval notification for requester_id: ' . $request->requester_id);
            Notification::notifyRequestApproved($request);
            \Log::info('Approval notification created successfully');
        } catch (\Exception $e) {
            \Log::error('Failed to create approval notification: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
        }

        return response()->json([
            'message' => 'Request approved',
            'data' => new AssetRequestResource($request->fresh(['items', 'approvals'])),
        ]);
    }

    /**
     * Reject a request
     */
    public function reject(Request $httpRequest, AssetRequest $request): JsonResponse
    {
        $this->authorize('approve', $request);

        $validated = $httpRequest->validate([
            'reason' => 'required|string|max:1000',
        ]);

        $this->requestService->reject(
            $request,
            $httpRequest->user(),
            $validated['reason']
        );

        // Send notification to requester (don't fail rejection if notification fails)
        try {
            Notification::notifyRequestRejected($request, $validated['reason']);
        } catch (\Exception $e) {
            \Log::error('Failed to create rejection notification: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Request rejected',
            'data' => new AssetRequestResource($request->fresh(['items', 'approvals'])),
        ]);
    }
}
