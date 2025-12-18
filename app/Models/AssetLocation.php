<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AssetLocation extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'building',
        'floor',
        'room',
        'address',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    // =========================================
    // Relationships
    // =========================================

    public function assets(): HasMany
    {
        return $this->hasMany(Asset::class, 'current_location_id');
    }

    // =========================================
    // Scopes
    // =========================================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // =========================================
    // Helpers
    // =========================================

    /**
     * Get full location name with building/floor/room
     */
    public function getFullNameAttribute(): string
    {
        $parts = array_filter([
            $this->building,
            $this->floor ? "Floor {$this->floor}" : null,
            $this->room ? "Room {$this->room}" : null,
        ]);

        if (empty($parts)) {
            return $this->name;
        }

        return "{$this->name} ({$this->implode(' - ', $parts)})";
    }

    /**
     * Get asset count at this location
     */
    public function getAssetCountAttribute(): int
    {
        return $this->assets()->count();
    }
}
