<?php

namespace App\Policies;

use App\Enums\ApprovalStatus;
use App\Enums\RequestStatus;
use App\Models\AssetRequest;
use App\Models\User;

class AssetRequestPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, AssetRequest $request): bool
    {
        // Owner can view their own requests
        if ($user->id === $request->requester_id) {
            return true;
        }

        // Admins can view all
        if ($user->hasRole(['asset_admin', 'super_admin'])) {
            return true;
        }

        // Assigned approver can view
        if ($request->approvals()->where('approver_id', $user->id)->exists()) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->is_active;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, AssetRequest $request): bool
    {
        // Only owner can update draft requests
        return $user->id === $request->requester_id 
            && $request->status === RequestStatus::DRAFT;
    }

    /**
     * Determine whether the user can submit the request.
     */
    public function submit(User $user, AssetRequest $request): bool
    {
        return $user->id === $request->requester_id 
            && $request->status === RequestStatus::DRAFT;
    }

    /**
     * Determine whether the user can approve the request.
     */
    public function approve(User $user, AssetRequest $request): bool
    {
        return $request->approvals()
            ->where('approver_id', $user->id)
            ->where('status', ApprovalStatus::PENDING)
            ->exists();
    }

    /**
     * Determine whether the user can fulfill the request.
     */
    public function fulfill(User $user, AssetRequest $request): bool
    {
        return $user->hasRole(['asset_admin', 'super_admin'])
            && $request->status === RequestStatus::APPROVED;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, AssetRequest $request): bool
    {
        // Only owner can delete draft requests
        return $user->id === $request->requester_id 
            && $request->status === RequestStatus::DRAFT;
    }
}
