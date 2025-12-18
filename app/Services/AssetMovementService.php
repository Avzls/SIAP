<?php

namespace App\Services;

use App\Enums\AssetStatus;
use App\Enums\MovementType;
use App\Models\Asset;
use App\Models\AssetLocation;
use App\Models\AssetMovement;
use App\Models\AssetRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AssetMovementService
{
    /**
     * Create a new asset and log the creation movement
     */
    public function create(
        array $assetData,
        User $performer,
        ?int $locationId = null
    ): Asset {
        return DB::transaction(function () use ($assetData, $performer, $locationId) {
            $assetData['status'] = AssetStatus::IN_STOCK;
            $assetData['current_location_id'] = $locationId;

            $asset = Asset::create($assetData);

            // Log creation movement
            AssetMovement::create([
                'asset_id' => $asset->id,
                'movement_type' => MovementType::CREATE,
                'from_status' => null,
                'to_status' => AssetStatus::IN_STOCK->value,
                'to_location_id' => $locationId,
                'performed_by' => $performer->id,
                'notes' => 'Asset created',
            ]);

            Log::channel('audit')->info('Asset created', [
                'asset_id' => $asset->id,
                'asset_tag' => $asset->asset_tag,
                'performed_by' => $performer->id,
            ]);

            return $asset;
        });
    }

    /**
     * Assign asset to user
     */
    public function assign(
        Asset $asset,
        User $toUser,
        User $performer,
        ?AssetRequest $request = null,
        ?string $notes = null
    ): AssetMovement {
        if (!$asset->canBeAssigned()) {
            throw new \InvalidArgumentException(
                "Asset cannot be assigned. Current status: {$asset->status->label()}"
            );
        }

        return DB::transaction(function () use ($asset, $toUser, $performer, $request, $notes) {
            $fromStatus = $asset->status->value;
            $fromUserId = $asset->current_user_id;
            $fromLocationId = $asset->current_location_id;

            // Update asset current state
            $asset->update([
                'status' => AssetStatus::ASSIGNED,
                'current_user_id' => $toUser->id,
            ]);

            // Create movement record (append-only audit)
            $movement = AssetMovement::create([
                'asset_id' => $asset->id,
                'movement_type' => MovementType::ASSIGN,
                'from_status' => $fromStatus,
                'to_status' => AssetStatus::ASSIGNED->value,
                'from_user_id' => $fromUserId,
                'to_user_id' => $toUser->id,
                'from_location_id' => $fromLocationId,
                'to_location_id' => $fromLocationId,
                'performed_by' => $performer->id,
                'request_id' => $request?->id,
                'notes' => $notes,
            ]);

            Log::channel('audit')->info('Asset assigned', [
                'asset_id' => $asset->id,
                'asset_tag' => $asset->asset_tag,
                'to_user' => $toUser->id,
                'to_user_name' => $toUser->name,
                'performed_by' => $performer->id,
                'movement_id' => $movement->id,
            ]);

            return $movement;
        });
    }

    /**
     * Return asset to stock
     */
    public function return(
        Asset $asset,
        User $performer,
        ?int $locationId = null,
        ?string $notes = null
    ): AssetMovement {
        if (!$asset->canBeReturned()) {
            throw new \InvalidArgumentException(
                "Asset cannot be returned. Current status: {$asset->status->label()}"
            );
        }

        return DB::transaction(function () use ($asset, $performer, $locationId, $notes) {
            $fromStatus = $asset->status->value;
            $fromUserId = $asset->current_user_id;
            $fromLocationId = $asset->current_location_id;
            $toLocationId = $locationId ?? $fromLocationId;

            // Update asset current state
            $asset->update([
                'status' => AssetStatus::IN_STOCK,
                'current_user_id' => null,
                'current_location_id' => $toLocationId,
            ]);

            $movement = AssetMovement::create([
                'asset_id' => $asset->id,
                'movement_type' => MovementType::RETURN,
                'from_status' => $fromStatus,
                'to_status' => AssetStatus::IN_STOCK->value,
                'from_user_id' => $fromUserId,
                'to_user_id' => null,
                'from_location_id' => $fromLocationId,
                'to_location_id' => $toLocationId,
                'performed_by' => $performer->id,
                'notes' => $notes,
            ]);

            Log::channel('audit')->info('Asset returned', [
                'asset_id' => $asset->id,
                'asset_tag' => $asset->asset_tag,
                'from_user' => $fromUserId,
                'performed_by' => $performer->id,
                'movement_id' => $movement->id,
            ]);

            return $movement;
        });
    }

    /**
     * Transfer asset between users
     */
    public function transfer(
        Asset $asset,
        User $toUser,
        User $performer,
        ?AssetRequest $request = null,
        ?string $notes = null
    ): AssetMovement {
        if ($asset->status !== AssetStatus::ASSIGNED) {
            throw new \InvalidArgumentException(
                "Only assigned assets can be transferred. Current status: {$asset->status->label()}"
            );
        }

        return DB::transaction(function () use ($asset, $toUser, $performer, $request, $notes) {
            $fromUserId = $asset->current_user_id;

            $asset->update([
                'current_user_id' => $toUser->id,
            ]);

            $movement = AssetMovement::create([
                'asset_id' => $asset->id,
                'movement_type' => MovementType::TRANSFER,
                'from_status' => AssetStatus::ASSIGNED->value,
                'to_status' => AssetStatus::ASSIGNED->value,
                'from_user_id' => $fromUserId,
                'to_user_id' => $toUser->id,
                'from_location_id' => $asset->current_location_id,
                'to_location_id' => $asset->current_location_id,
                'performed_by' => $performer->id,
                'request_id' => $request?->id,
                'notes' => $notes,
            ]);

            Log::channel('audit')->info('Asset transferred', [
                'asset_id' => $asset->id,
                'asset_tag' => $asset->asset_tag,
                'from_user' => $fromUserId,
                'to_user' => $toUser->id,
                'performed_by' => $performer->id,
                'movement_id' => $movement->id,
            ]);

            return $movement;
        });
    }

    /**
     * Send asset for repair
     */
    public function sendForRepair(
        Asset $asset,
        User $performer,
        string $notes
    ): AssetMovement {
        return DB::transaction(function () use ($asset, $performer, $notes) {
            $fromStatus = $asset->status->value;
            $fromUserId = $asset->current_user_id;

            $asset->update(['status' => AssetStatus::IN_REPAIR]);

            $movement = AssetMovement::create([
                'asset_id' => $asset->id,
                'movement_type' => MovementType::REPAIR_OUT,
                'from_status' => $fromStatus,
                'to_status' => AssetStatus::IN_REPAIR->value,
                'from_user_id' => $fromUserId,
                'performed_by' => $performer->id,
                'notes' => $notes,
            ]);

            Log::channel('audit')->info('Asset sent for repair', [
                'asset_id' => $asset->id,
                'asset_tag' => $asset->asset_tag,
                'performed_by' => $performer->id,
                'reason' => $notes,
            ]);

            return $movement;
        });
    }

    /**
     * Return asset from repair
     */
    public function returnFromRepair(
        Asset $asset,
        User $performer,
        ?User $assignToUser = null,
        ?string $notes = null
    ): AssetMovement {
        if ($asset->status !== AssetStatus::IN_REPAIR) {
            throw new \InvalidArgumentException('Asset is not in repair');
        }

        return DB::transaction(function () use ($asset, $performer, $assignToUser, $notes) {
            $toStatus = $assignToUser ? AssetStatus::ASSIGNED : AssetStatus::IN_STOCK;

            $asset->update([
                'status' => $toStatus,
                'current_user_id' => $assignToUser?->id,
            ]);

            $movement = AssetMovement::create([
                'asset_id' => $asset->id,
                'movement_type' => MovementType::REPAIR_IN,
                'from_status' => AssetStatus::IN_REPAIR->value,
                'to_status' => $toStatus->value,
                'to_user_id' => $assignToUser?->id,
                'performed_by' => $performer->id,
                'notes' => $notes,
            ]);

            Log::channel('audit')->info('Asset returned from repair', [
                'asset_id' => $asset->id,
                'asset_tag' => $asset->asset_tag,
                'new_status' => $toStatus->value,
                'performed_by' => $performer->id,
            ]);

            return $movement;
        });
    }

    /**
     * Retire asset
     */
    public function retire(
        Asset $asset,
        User $performer,
        string $reason
    ): AssetMovement {
        return DB::transaction(function () use ($asset, $performer, $reason) {
            $fromStatus = $asset->status->value;
            $fromUserId = $asset->current_user_id;

            $asset->update([
                'status' => AssetStatus::RETIRED,
                'current_user_id' => null,
            ]);

            $movement = AssetMovement::create([
                'asset_id' => $asset->id,
                'movement_type' => MovementType::RETIRE,
                'from_status' => $fromStatus,
                'to_status' => AssetStatus::RETIRED->value,
                'from_user_id' => $fromUserId,
                'performed_by' => $performer->id,
                'notes' => $reason,
            ]);

            Log::channel('audit')->info('Asset retired', [
                'asset_id' => $asset->id,
                'asset_tag' => $asset->asset_tag,
                'performed_by' => $performer->id,
                'reason' => $reason,
            ]);

            return $movement;
        });
    }

    /**
     * Mark asset as lost
     */
    public function markLost(
        Asset $asset,
        User $performer,
        string $notes
    ): AssetMovement {
        return DB::transaction(function () use ($asset, $performer, $notes) {
            $fromStatus = $asset->status->value;
            $fromUserId = $asset->current_user_id;

            $asset->update(['status' => AssetStatus::LOST]);

            $movement = AssetMovement::create([
                'asset_id' => $asset->id,
                'movement_type' => MovementType::LOST,
                'from_status' => $fromStatus,
                'to_status' => AssetStatus::LOST->value,
                'from_user_id' => $fromUserId,
                'performed_by' => $performer->id,
                'notes' => $notes,
            ]);

            Log::channel('audit')->info('Asset marked as lost', [
                'asset_id' => $asset->id,
                'asset_tag' => $asset->asset_tag,
                'last_user' => $fromUserId,
                'performed_by' => $performer->id,
                'notes' => $notes,
            ]);

            return $movement;
        });
    }

    /**
     * Mark lost asset as found
     */
    public function markFound(
        Asset $asset,
        User $performer,
        ?int $locationId = null,
        ?string $notes = null
    ): AssetMovement {
        if ($asset->status !== AssetStatus::LOST) {
            throw new \InvalidArgumentException('Asset is not marked as lost');
        }

        return DB::transaction(function () use ($asset, $performer, $locationId, $notes) {
            $asset->update([
                'status' => AssetStatus::IN_STOCK,
                'current_location_id' => $locationId,
            ]);

            $movement = AssetMovement::create([
                'asset_id' => $asset->id,
                'movement_type' => MovementType::FOUND,
                'from_status' => AssetStatus::LOST->value,
                'to_status' => AssetStatus::IN_STOCK->value,
                'to_location_id' => $locationId,
                'performed_by' => $performer->id,
                'notes' => $notes,
            ]);

            Log::channel('audit')->info('Lost asset found', [
                'asset_id' => $asset->id,
                'asset_tag' => $asset->asset_tag,
                'performed_by' => $performer->id,
            ]);

            return $movement;
        });
    }

    /**
     * Update asset location
     */
    public function relocate(
        Asset $asset,
        AssetLocation $toLocation,
        User $performer,
        ?string $notes = null
    ): AssetMovement {
        return DB::transaction(function () use ($asset, $toLocation, $performer, $notes) {
            $fromLocationId = $asset->current_location_id;

            $asset->update(['current_location_id' => $toLocation->id]);

            $movement = AssetMovement::create([
                'asset_id' => $asset->id,
                'movement_type' => MovementType::TRANSFER,
                'from_status' => $asset->status->value,
                'to_status' => $asset->status->value,
                'from_user_id' => $asset->current_user_id,
                'to_user_id' => $asset->current_user_id,
                'from_location_id' => $fromLocationId,
                'to_location_id' => $toLocation->id,
                'performed_by' => $performer->id,
                'notes' => $notes ?? "Relocated to {$toLocation->name}",
            ]);

            Log::channel('audit')->info('Asset relocated', [
                'asset_id' => $asset->id,
                'asset_tag' => $asset->asset_tag,
                'from_location' => $fromLocationId,
                'to_location' => $toLocation->id,
                'performed_by' => $performer->id,
            ]);

            return $movement;
        });
    }
}
