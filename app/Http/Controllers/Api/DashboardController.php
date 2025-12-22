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
        $myRequests = AssetRequest::where('requester_id', $user->id)->count();
        $myPendingRequests = AssetRequest::where('requester_id', $user->id)
            ->whereIn('status', ['DRAFT', 'PENDING_APPROVAL', 'APPROVED'])
            ->count();
        
        // Pending approvals (for approvers/admins)
        $pendingApprovals = 0;
        if ($user->hasAnyRole(['approver', 'super_admin'])) {
            $pendingApprovals = AssetRequest::where('status', 'PENDING_APPROVAL')
                ->whereHas('approvals', function ($q) use ($user) {
                    $q->where('approver_id', $user->id)
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
            ->where('requester_id', $user->id)
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
        
        // Analytics data for charts
        
        // Asset distribution by category
        $assetsByCategory = Asset::join('asset_categories', 'assets.category_id', '=', 'asset_categories.id')
            ->selectRaw('asset_categories.name as category, COUNT(*) as count')
            ->groupBy('asset_categories.id', 'asset_categories.name')
            ->get()
            ->map(fn($item) => [
                'name' => $item->category,
                'value' => $item->count,
            ]);
        
        // Asset distribution by location (handle null locations)
        $assetsByLocation = Asset::leftJoin('asset_locations', 'assets.current_location_id', '=', 'asset_locations.id')
            ->whereNotNull('assets.current_location_id')
            ->selectRaw('asset_locations.name as location, COUNT(*) as count')
            ->groupBy('asset_locations.id', 'asset_locations.name')
            ->get()
            ->map(fn($item) => [
                'name' => $item->location ?? 'Unknown',
                'value' => $item->count,
            ]);
        
        // Asset distribution by status (with labels)
        $assetsByStatusDetailed = collect($assetsByStatus)->map(function($count, $status) {
            return [
                'name' => \App\Enums\AssetStatus::from($status)->label(),
                'value' => $count,
                'status' => $status,
            ];
        })->values();
        
        // Monthly acquisition trend (last 12 months)
        $monthlyAcquisitions = Asset::selectRaw('DATE_FORMAT(purchase_date, "%Y-%m") as month, COUNT(*) as count')
            ->where('purchase_date', '>=', now()->subMonths(12))
            ->whereNotNull('purchase_date')
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(fn($item) => [
                'month' => $item->month,
                'count' => $item->count,
            ]);
        
        // Request statistics by type
        $requestsByType = AssetRequest::selectRaw('request_type, COUNT(*) as count')
            ->groupBy('request_type')
            ->get()
            ->map(fn($item) => [
                'name' => \App\Enums\RequestType::from($item->request_type)->label(),
                'value' => $item->count,
                'type' => $item->request_type,
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
                'analytics' => [
                    'assets_by_category' => $assetsByCategory,
                    'assets_by_location' => $assetsByLocation,
                    'assets_by_status' => $assetsByStatusDetailed,
                    'monthly_trend' => $monthlyAcquisitions,
                    'requests_by_type' => $requestsByType,
                ],
                'recent_assets' => $recentAssets,
                'recent_requests' => $recentRequests,
            ],
        ]);
    }
}
