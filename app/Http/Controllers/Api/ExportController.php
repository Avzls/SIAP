<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\AssetMovement;
use App\Models\AssetRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExportController extends Controller
{
    /**
     * Export Assets Summary Report
     */
    public function exportAssetsSummary(Request $request)
    {
        $format = $request->get('format', 'excel'); // excel or pdf
        
        // Build query with filters
        $query = Asset::with(['category', 'currentLocation', 'currentUser'])
            ->select('assets.*');

        // Apply filters
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('location_id')) {
            $query->where('current_location_id', $request->location_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $assets = $query->get();

        if ($format === 'pdf') {
            return $this->exportAssetsSummaryPDF($assets, $request->all());
        }

        return $this->exportAssetsSummaryExcel($assets);
    }

    /**
     * Export Movements Report
     */
    public function exportMovements(Request $request)
    {
        $format = $request->get('format', 'excel');
        
        $query = AssetMovement::with(['asset', 'performedBy'])
            ->select('asset_movements.*')
            ->orderBy('created_at', 'desc');

        // Date range filter
        if ($request->has('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        // Type filter
        if ($request->has('type')) {
            $query->where('movement_type', $request->type);
        }

        $movements = $query->get();

        if ($format === 'pdf') {
            return $this->exportMovementsPDF($movements, $request->all());
        }

        return $this->exportMovementsExcel($movements);
    }

    /**
     * Export Requests Report
     */
    public function exportRequests(Request $request)
    {
        $format = $request->get('format', 'excel');
        
        $query = AssetRequest::with(['requester', 'approver', 'items.category'])
            ->select('asset_requests.*')
            ->orderBy('created_at', 'desc');

        // Date range filter
        if ($request->has('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        // Status filter
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $requests = $query->get();

        if ($format === 'pdf') {
            return $this->exportRequestsPDF($requests, $request->all());
        }

        return $this->exportRequestsExcel($requests);
    }

    /**
     * Generate Excel (CSV) for Assets Summary
     */
    private function exportAssetsSummaryExcel($assets)
    {
        $filename = 'assets-summary-' . date('Y-m-d') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0'
        ];

        $callback = function() use ($assets) {
            $file = fopen('php://output', 'w');
            
            // Add BOM for UTF-8
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            // Headers
            fputcsv($file, [
                'Asset Tag',
                'Name',
                'Category',
                'Status',
                'Current User',
                'Current Location',
                'Purchase Price (Rp)',
                'Purchase Date',
                'Brand',
                'Model',
                'Serial Number'
            ]);

            // Data rows
            foreach ($assets as $asset) {
                fputcsv($file, [
                    $asset->asset_tag,
                    $asset->name,
                    $asset->category?->name ?? '-',
                    $asset->status->label(),
                    $asset->currentUser?->name ?? '-',
                    $asset->currentLocation?->name ?? '-',
                    $asset->purchase_price ? number_format($asset->purchase_price, 0, ',', '.') : '-',
                    $asset->purchase_date ? date('d/m/Y', strtotime($asset->purchase_date)) : '-',
                    $asset->brand ?? '-',
                    $asset->model ?? '-',
                    $asset->serial_number ?? '-',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Generate Excel (CSV) for Movements
     */
    private function exportMovementsExcel($movements)
    {
        $filename = 'movements-' . date('Y-m-d') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function() use ($movements) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            fputcsv($file, [
                'Date',
                'Asset Tag',
                'Asset Name',
                'Type',
                'From',
                'To',
                'Performed By',
                'Notes'
            ]);

            foreach ($movements as $movement) {
                fputcsv($file, [
                    date('d/m/Y H:i', strtotime($movement->created_at)),
                    $movement->asset?->asset_tag ?? '-',
                    $movement->asset?->name ?? '-',
                    $movement->movement_type->label(),
                    $movement->from_value ?? '-',
                    $movement->to_value ?? '-',
                    $movement->performer?->name ?? '-',
                    $movement->notes ?? '-',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Generate Excel (CSV) for Requests
     */
    private function exportRequestsExcel($requests)
    {
        $filename = 'requests-' . date('Y-m-d') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function() use ($requests) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            fputcsv($file, [
                'Request #',
                'Type',
                'Requester',
                'Items Summary',
                'Status',
                'Created Date',
                'Approved By',
                'Approved Date'
            ]);

            foreach ($requests as $request) {
                $itemsSummary = $request->items->map(function($item) {
                    return $item->category?->name . ' (x' . $item->quantity . ')';
                })->join(', ');

                fputcsv($file, [
                    $request->request_number,
                    $request->type->label(),
                    $request->requester?->name ?? '-',
                    $itemsSummary,
                    $request->status->label(),
                    date('d/m/Y', strtotime($request->created_at)),
                    $request->approver?->name ?? '-',
                    $request->approved_at ? date('d/m/Y', strtotime($request->approved_at)) : '-',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Generate PDF for Assets Summary
     */
    private function exportAssetsSummaryPDF($assets, $filters)
    {
        $html = view('exports.assets-summary-pdf', [
            'assets' => $assets,
            'filters' => $filters,
            'generated_at' => now()->format('d/m/Y H:i')
        ])->render();

        return response($html)
            ->header('Content-Type', 'text/html')
            ->header('Content-Disposition', 'attachment; filename="assets-summary-' . date('Y-m-d') . '.html"');
    }

    /**
     * Generate PDF for Movements
     */
    private function exportMovementsPDF($movements, $filters)
    {
        $html = view('exports.movements-pdf', [
            'movements' => $movements,
            'filters' => $filters,
            'generated_at' => now()->format('d/m/Y H:i')
        ])->render();

        return response($html)
            ->header('Content-Type', 'text/html')
            ->header('Content-Disposition', 'attachment; filename="movements-' . date('Y-m-d') . '.html"');
    }

    /**
     * Generate PDF for Requests
     */
    private function exportRequestsPDF($requests, $filters)
    {
        $html = view('exports.requests-pdf', [
            'requests' => $requests,
            'filters' => $filters,
            'generated_at' => now()->format('d/m/Y H:i')
        ])->render();

        return response($html)
            ->header('Content-Type', 'text/html')
            ->header('Content-Disposition', 'attachment; filename="requests-' . date('Y-m-d') . '.html"');
    }
}
