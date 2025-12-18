<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AssetCategory extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'description',
        'requires_approval',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'requires_approval' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    // =========================================
    // Relationships
    // =========================================

    public function assets(): HasMany
    {
        return $this->hasMany(Asset::class, 'category_id');
    }

    public function requestItems(): HasMany
    {
        return $this->hasMany(AssetRequestItem::class, 'category_id');
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
     * Get count of assets in stock for this category
     */
    public function getInStockCountAttribute(): int
    {
        return $this->assets()->where('status', 'IN_STOCK')->count();
    }
}
