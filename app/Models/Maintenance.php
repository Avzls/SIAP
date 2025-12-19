<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Maintenance extends Model
{
    use HasFactory;

    protected $fillable = [
        'asset_id',
        'schedule_id',
        'type', // PREVENTIVE, CORRECTIVE
        'title',
        'description',
        'cost',
        'status',
        'performed_by',
        'completed_at',
        'created_by'
    ];

    protected $casts = [
        'cost' => 'decimal:2',
        'completed_at' => 'datetime',
    ];

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }

    public function schedule()
    {
        return $this->belongsTo(MaintenanceSchedule::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
