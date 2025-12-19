<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AssetMovementResource;
use App\Models\Asset;
use App\Models\AssetMovement;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AssetMovementController extends Controller
{
    /**
     * Get movements for a specific asset (audit trail)
     */
    public function index(Request $request, Asset $asset): AnonymousResourceCollection
    {
        $query = $asset->movements()
            ->with(['performer', 'fromUser', 'toUser', 'fromLocation', 'toLocation']);

        // Filter by movement type
        if ($request->filled('type')) {
            $query->where('movement_type', $request->type);
        }

        // Filter by date range
        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        $movements = $query->orderByDesc('created_at')
            ->paginate($request->get('per_page', 50));

        return AssetMovementResource::collection($movements);
    }

    /**
     * Get all movements (for reporting)
     * Note: Route already protected by role middleware (asset_admin|super_admin)
     */
    public function all(Request $request): AnonymousResourceCollection
    {
        $query = AssetMovement::with([
            'asset',
            'performer',
            'fromUser',
            'toUser',
            'fromLocation',
            'toLocation',
        ]);

        // Filter by asset
        if ($request->filled('asset_id')) {
            $query->where('asset_id', $request->asset_id);
        }

        // Filter by performer
        if ($request->filled('performed_by')) {
            $query->where('performed_by', $request->performed_by);
        }

        // Filter by movement type
        if ($request->filled('type')) {
            $query->where('movement_type', $request->type);
        }

        // Filter by date range
        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        $movements = $query->orderByDesc('created_at')
            ->paginate($request->get('per_page', 50));

        return AssetMovementResource::collection($movements);
    }
}
