<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Maintenance;
use App\Models\MaintenanceSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MaintenanceController extends Controller
{
    // =========================================
    // Schedules
    // =========================================

    public function indexSchedules(Request $request)
    {
        $query = MaintenanceSchedule::with(['asset.currentLocation', 'creator'])
            ->where('is_active', true)
            ->orderBy('next_due_at', 'asc');

        if ($request->has('upcoming')) {
            $query->where('next_due_at', '<=', now()->addDays(30));
        }

        return response()->json([
            'data' => $query->paginate(10)
        ]);
    }

    public function storeSchedule(Request $request)
    {
        $request->validate([
            'asset_id' => 'required|exists:assets,id',
            'title' => 'required|string',
            'frequency_days' => 'required|integer|min:1',
            'next_due_at' => 'required|date',
        ]);

        $schedule = MaintenanceSchedule::create([
            'asset_id' => $request->asset_id,
            'title' => $request->title,
            'frequency_days' => $request->frequency_days,
            'next_due_at' => $request->next_due_at,
            'created_by' => Auth::id(),
        ]);

        return response()->json([
            'message' => 'Jadwal maintenance berhasil dibuat',
            'data' => $schedule
        ], 201);
    }

    public function deleteSchedule($id)
    {
        $schedule = MaintenanceSchedule::findOrFail($id);
        $schedule->delete();
        
        return response()->json(['message' => 'Jadwal dihapus']);
    }

    // =========================================
    // Logs (Execution)
    // =========================================

    public function indexLogs(Request $request)
    {
        $query = Maintenance::with(['asset', 'schedule', 'creator'])
            ->latest('completed_at');

        return response()->json([
            'data' => $query->paginate(10)
        ]);
    }

    public function storeLog(Request $request)
    {
        $request->validate([
            'asset_id' => 'required|exists:assets,id',
            'type' => 'required|in:PREVENTIVE,CORRECTIVE',
            'title' => 'required|string',
            'status' => 'required|string',
            'completed_at' => 'required|date',
            'schedule_id' => 'nullable|exists:maintenance_schedules,id',
        ]);

        try {
            DB::beginTransaction();

            $log = Maintenance::create([
                'asset_id' => $request->asset_id,
                'schedule_id' => $request->schedule_id,
                'type' => $request->type,
                'title' => $request->title,
                'description' => $request->description,
                'cost' => $request->cost ?? 0,
                'status' => $request->status,
                'performed_by' => $request->performed_by,
                'completed_at' => $request->completed_at,
                'created_by' => Auth::id(),
            ]);

            // If linked to a schedule and completed, update the next due date
            if ($request->schedule_id && $request->status === 'COMPLETED') {
                $schedule = MaintenanceSchedule::find($request->schedule_id);
                if ($schedule) {
                    $schedule->update([
                        'last_performed_at' => $request->completed_at,
                        'next_due_at' => Carbon::parse($request->completed_at)->addDays($schedule->frequency_days),
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Laporan maintenance berhasil disimpan',
                'data' => $log
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal menyimpan laporan: ' . $e->getMessage()], 500);
        }
    }
}
