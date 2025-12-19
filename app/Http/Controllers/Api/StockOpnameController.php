<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockOpname;
use App\Models\StockOpnameDetail;
use App\Models\Asset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class StockOpnameController extends Controller
{
    /**
     * List all audit sessions
     */
    public function index(Request $request)
    {
        $query = StockOpname::with(['location', 'creator'])
            ->latest();

        return response()->json([
            'data' => $query->paginate(10)
        ]);
    }

    /**
     * Create new audit session
     * Also snapshots assets in the location
     */
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'assigned_location_id' => 'required|exists:asset_locations,id',
            'start_date' => 'required|date',
        ]);

        try {
            DB::beginTransaction();

            $opname = StockOpname::create([
                'title' => $request->title,
                'description' => $request->description,
                'status' => 'IN_PROGRESS',
                'assigned_location_id' => $request->assigned_location_id,
                'start_date' => $request->start_date,
                'created_by' => Auth::id(),
            ]);

            // Snapshot logic: Get all assets in location
            $assets = Asset::where('current_location_id', $request->assigned_location_id)
                ->whereIn('status', ['IN_STOCK', 'ASSIGNED'])
                ->get();

            foreach ($assets as $asset) {
                StockOpnameDetail::create([
                    'stock_opname_id' => $opname->id,
                    'asset_id' => $asset->id,
                    'status' => 'MISSING', // Default is missing until scanned
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Audit session created successfully',
                'data' => $opname
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create session: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get session details with items
     */
    public function show($id)
    {
        $opname = StockOpname::with(['location', 'creator', 'details.asset', 'details.scanner'])
            ->findOrFail($id);

        $stats = [
            'total' => $opname->details->count(),
            'found' => $opname->details->where('status', 'FOUND')->count(),
            'missing' => $opname->details->where('status', 'MISSING')->count(),
            'unlisted' => $opname->details->where('status', 'UNLISTED')->count(),
        ];

        return response()->json([
            'data' => $opname,
            'stats' => $stats
        ]);
    }

    /**
     * Scan an asset (mark as FOUND)
     */
    public function scan(Request $request, $id)
    {
        $request->validate([
            'asset_tag' => 'required|string',
        ]);

        $opname = StockOpname::findOrFail($id);

        if ($opname->status !== 'IN_PROGRESS') {
            return response()->json(['message' => 'Audit session is not in progress'], 400);
        }

        $asset = Asset::with('currentLocation')->where('asset_tag', $request->asset_tag)->first();

        if (!$asset) {
            return response()->json(['message' => 'Asset not found'], 404);
        }

        $detail = StockOpnameDetail::where('stock_opname_id', $id)
            ->where('asset_id', $asset->id)
            ->first();

        if ($detail) {
            // Asset was expected
            $detail->update([
                'status' => 'FOUND',
                'scanned_at' => now(),
                'scanned_by' => Auth::id(),
            ]);
            $status = 'FOUND';
        } else {
            // Asset found but not expected in this location (UNLISTED)
            $detail = StockOpnameDetail::create([
                'stock_opname_id' => $id,
                'asset_id' => $asset->id,
                'status' => 'UNLISTED',
                'scanned_at' => now(),
                'scanned_by' => Auth::id(),
                'notes' => 'Found in location but syscord mismatch'
            ]);
            $status = 'UNLISTED';
        }

        return response()->json([
            'message' => 'Asset scanned successfully',
            'status' => $status,
            'detail' => $detail
        ]);
    }

    /**
     * Finalize the session
     * Optionally update system location for found assets (Not implemented yet to keep it simple)
     */
    public function finalize($id)
    {
        $opname = StockOpname::findOrFail($id);
        
        $opname->update([
            'status' => 'COMPLETED',
            'end_date' => now(),
        ]);

        return response()->json(['message' => 'Audit session finalized']);
    }
    
    /**
     * Cancel session
     */
     public function cancel($id)
     {
         $opname = StockOpname::findOrFail($id);
         $opname->update(['status' => 'CANCELLED']);
         return response()->json(['message' => 'Audit session cancelled']);
     }
}
