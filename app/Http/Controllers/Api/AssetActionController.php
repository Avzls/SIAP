<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\User;
use App\Services\AssetMovementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssetActionController extends Controller
{
    public function __construct(
        protected AssetMovementService $movementService
    ) {}

    /**
     * Assign asset to user
     */
    public function assign(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('assign', $asset);

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        $toUser = User::findOrFail($validated['user_id']);

        $movement = $this->movementService->assign(
            $asset,
            $toUser,
            $request->user(),
            null,
            $validated['notes'] ?? null
        );

        return response()->json([
            'message' => "Asset assigned to {$toUser->name}",
            'movement_id' => $movement->id,
        ]);
    }

    /**
     * Return asset to stock
     */
    public function return(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('update', $asset);

        $validated = $request->validate([
            'location_id' => 'nullable|exists:asset_locations,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        $movement = $this->movementService->return(
            $asset,
            $request->user(),
            $validated['location_id'] ?? null,
            $validated['notes'] ?? null
        );

        return response()->json([
            'message' => 'Asset returned to stock',
            'movement_id' => $movement->id,
        ]);
    }

    /**
     * Transfer asset to another user
     */
    public function transfer(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('assign', $asset);

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        $toUser = User::findOrFail($validated['user_id']);

        $movement = $this->movementService->transfer(
            $asset,
            $toUser,
            $request->user(),
            null,
            $validated['notes'] ?? null
        );

        return response()->json([
            'message' => "Asset transferred to {$toUser->name}",
            'movement_id' => $movement->id,
        ]);
    }

    /**
     * Send asset for repair
     */
    public function repair(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('update', $asset);

        $validated = $request->validate([
            'notes' => 'required|string|max:1000',
        ]);

        $movement = $this->movementService->sendForRepair(
            $asset,
            $request->user(),
            $validated['notes']
        );

        return response()->json([
            'message' => 'Asset sent for repair',
            'movement_id' => $movement->id,
        ]);
    }

    /**
     * Return asset from repair
     */
    public function repairComplete(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('update', $asset);

        $validated = $request->validate([
            'assign_to_user_id' => 'nullable|exists:users,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        $assignToUser = isset($validated['assign_to_user_id']) 
            ? User::find($validated['assign_to_user_id']) 
            : null;

        $movement = $this->movementService->returnFromRepair(
            $asset,
            $request->user(),
            $assignToUser,
            $validated['notes'] ?? null
        );

        return response()->json([
            'message' => 'Asset returned from repair',
            'movement_id' => $movement->id,
        ]);
    }

    /**
     * Retire asset
     */
    public function retire(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('update', $asset);

        $validated = $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        $movement = $this->movementService->retire(
            $asset,
            $request->user(),
            $validated['reason']
        );

        return response()->json([
            'message' => 'Asset retired',
            'movement_id' => $movement->id,
        ]);
    }

    /**
     * Mark asset as lost
     */
    public function markLost(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('update', $asset);

        $validated = $request->validate([
            'notes' => 'required|string|max:1000',
        ]);

        $movement = $this->movementService->markLost(
            $asset,
            $request->user(),
            $validated['notes']
        );

        return response()->json([
            'message' => 'Asset marked as lost',
            'movement_id' => $movement->id,
        ]);
    }

    /**
     * Mark lost asset as found
     */
    public function markFound(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('update', $asset);

        $validated = $request->validate([
            'location_id' => 'nullable|exists:asset_locations,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        $movement = $this->movementService->markFound(
            $asset,
            $request->user(),
            $validated['location_id'] ?? null,
            $validated['notes'] ?? null
        );

        return response()->json([
            'message' => 'Asset marked as found',
            'movement_id' => $movement->id,
        ]);
    }
}
