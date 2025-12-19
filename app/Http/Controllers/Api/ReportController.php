<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\AssetLocation;
use App\Models\AssetRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Get asset summary report
     * 
     * Returns statistics about assets grouped by status, category, and location
     */
    public function assetsSummary(Request $request): JsonResponse
    {
        // Total counts by status
        $byStatus = Asset::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        // Total counts by category
        $byCategory = Asset::selectRaw('category_id, COUNT(*) as count')
            ->with('category:id,name,code')
            ->groupBy('category_id')
            ->get()
            ->map(fn($item) => [
                'category_id' => $item->category_id,
                'category_name' => $item->category?->name ?? 'Tidak Dikategorikan',
                'category_code' => $item->category?->code ?? '-',
                'count' => $item->count,
            ]);

        // Total counts by location
        $byLocation = Asset::selectRaw('current_location_id, COUNT(*) as count')
            ->with('currentLocation:id,name,code')
            ->groupBy('current_location_id')
            ->get()
            ->map(fn($item) => [
                'location_id' => $item->current_location_id,
                'location_name' => $item->currentLocation?->name ?? 'Tidak Ada Lokasi',
                'location_code' => $item->currentLocation?->code ?? '-',
                'count' => $item->count,
            ]);

        // Value summary
        $totalValue = Asset::sum('purchase_price');
        $totalAssets = Asset::count();

        // Assets with expiring warranty (next 30 days)
        $expiringWarranty = Asset::where('warranty_end', '>=', now())
            ->where('warranty_end', '<=', now()->addDays(30))
            ->count();

        return response()->json([
            'data' => [
                'summary' => [
                    'total_assets' => $totalAssets,
                    'total_value' => (float) $totalValue,
                    'expiring_warranty' => $expiringWarranty,
                ],
                'by_status' => $byStatus,
                'by_category' => $byCategory,
                'by_location' => $byLocation,
            ],
        ]);
    }

    /**
     * Get request statistics report
     * 
     * Returns statistics about asset requests grouped by status and type
     */
    public function requests(Request $request): JsonResponse
    {
        $query = AssetRequest::query();

        // Filter by date range
        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        // Total counts by status
        $byStatus = (clone $query)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        // Total counts by request type
        $byType = (clone $query)
            ->selectRaw('request_type, COUNT(*) as count')
            ->groupBy('request_type')
            ->pluck('count', 'request_type')
            ->toArray();

        // Monthly trend (last 6 months)
        $monthlyTrend = AssetRequest::selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count")
            ->where('created_at', '>=', now()->subMonths(6))
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('count', 'month')
            ->toArray();

        // Summary stats
        $totalRequests = $query->count();
        $pendingRequests = AssetRequest::whereIn('status', ['DRAFT', 'PENDING_APPROVAL', 'APPROVED'])->count();
        $completedRequests = AssetRequest::where('status', 'FULFILLED')->count();

        return response()->json([
            'data' => [
                'summary' => [
                    'total_requests' => $totalRequests,
                    'pending_requests' => $pendingRequests,
                    'completed_requests' => $completedRequests,
                ],
                'by_status' => $byStatus,
                'by_type' => $byType,
                'monthly_trend' => $monthlyTrend,
            ],
        ]);
    }
}
