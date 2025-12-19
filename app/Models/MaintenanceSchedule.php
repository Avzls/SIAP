<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MaintenanceSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'asset_id',
        'title',
        'frequency_days',
        'last_performed_at',
        'next_due_at',
        'is_active',
        'created_by'
    ];

    protected $casts = [
        'last_performed_at' => 'date',
        'next_due_at' => 'date',
        'is_active' => 'boolean',
    ];

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }

    public function maintenances()
    {
        return $this->hasMany(Maintenance::class, 'schedule_id')->orderByDesc('completed_at');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
