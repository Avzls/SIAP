<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\AssetRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Get dashboard statistics and recent data
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Asset counts
        $totalAssets = Asset::count();
        $assetsByStatus = Asset::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();
        
        // User's requests count
        $myRequests = AssetRequest::where('requester_user_id', $user->id)->count();
        $myPendingRequests = AssetRequest::where('requester_user_id', $user->id)
            ->whereIn('status', ['DRAFT', 'PENDING_APPROVAL', 'APPROVED'])
            ->count();
        
        // Pending approvals (for approvers/admins)
        $pendingApprovals = 0;
        if ($user->hasAnyRole(['approver', 'super_admin'])) {
            $pendingApprovals = AssetRequest::where('status', 'PENDING_APPROVAL')
                ->whereHas('approvals', function ($q) use ($user) {
                    $q->where('approver_user_id', $user->id)
                      ->whereNull('decided_at');
                })
                ->count();
        }
        
        // Pending fulfillment (for asset admins)
        $pendingFulfillment = 0;
        if ($user->hasAnyRole(['asset_admin', 'super_admin'])) {
            $pendingFulfillment = AssetRequest::where('status', 'APPROVED')->count();
        }
        
        // Recent assets (5)
        $recentAssets = Asset::with(['category', 'currentLocation'])
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($asset) => [
                'id' => $asset->id,
                'asset_tag' => $asset->asset_tag,
                'name' => $asset->name,
                'category' => $asset->category?->name,
                'status' => $asset->status,
                'location' => $asset->currentLocation?->name,
            ]);
        
        // Recent requests (5)
        $recentRequests = AssetRequest::with(['requester'])
            ->where('requester_user_id', $user->id)
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($req) => [
                'id' => $req->id,
                'request_number' => $req->request_number,
                'request_type' => $req->request_type,
                'status' => $req->status,
                'created_at' => $req->created_at,
            ]);
        
        return response()->json([
            'data' => [
                'stats' => [
                    'total_assets' => $totalAssets,
                    'assets_by_status' => $assetsByStatus,
                    'my_requests' => $myRequests,
                    'my_pending_requests' => $myPendingRequests,
                    'pending_approvals' => $pendingApprovals,
                    'pending_fulfillment' => $pendingFulfillment,
                ],
                'recent_assets' => $recentAssets,
                'recent_requests' => $recentRequests,
            ],
        ]);
    }
}
