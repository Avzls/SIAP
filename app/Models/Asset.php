<?php

namespace App\Models;

use App\Enums\AssetStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Asset extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'asset_tag',
        'name',
        'category_id',
        'status',
        'current_user_id',
        'current_location_id',
        'brand',
        'model',
        'serial_number',
        'purchase_date',
        'purchase_price',
        'useful_life_years',
        'residual_value',
        'warranty_end',
        'specifications',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => AssetStatus::class,
            'purchase_date' => 'date',
            'purchase_price' => 'decimal:2',
            'residual_value' => 'decimal:2',
            'useful_life_years' => 'integer',
            'warranty_end' => 'date',
            'specifications' => 'array',
        ];
    }

    // =========================================
    // Relationships
    // =========================================

    public function category(): BelongsTo
    {
        return $this->belongsTo(AssetCategory::class, 'category_id');
    }

    public function currentUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'current_user_id');
    }

    public function currentLocation(): BelongsTo
    {
        return $this->belongsTo(AssetLocation::class, 'current_location_id');
    }

    public function movements(): HasMany
    {
        return $this->hasMany(AssetMovement::class)->orderByDesc('created_at');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(AssetAttachment::class);
    }

    // =========================================
    // Scopes
    // =========================================

    public function scopeInStock($query)
    {
        return $query->where('status', AssetStatus::IN_STOCK);
    }

    public function scopeAssigned($query)
    {
        return $query->where('status', AssetStatus::ASSIGNED);
    }

    public function scopeAvailable($query)
    {
        return $query->where('status', AssetStatus::IN_STOCK);
    }

    public function scopeByCategory($query, int $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }

    public function scopeByLocation($query, int $locationId)
    {
        return $query->where('current_location_id', $locationId);
    }

    public function scopeAssignedTo($query, int $userId)
    {
        return $query->where('current_user_id', $userId);
    }

    // =========================================
    // Helpers
    // =========================================

    /**
     * Check if asset can be assigned
     */
    public function canBeAssigned(): bool
    {
        return $this->status->canBeAssigned();
    }

    /**
     * Check if asset can be returned
     */
    public function canBeReturned(): bool
    {
        return $this->status->canBeReturned();
    }

    /**
     * Check if warranty is still valid
     */
    public function isUnderWarranty(): bool
    {
        return $this->warranty_end && $this->warranty_end->isFuture();
    }

    /**
     * Get the latest movement
     */
    public function getLatestMovementAttribute(): ?AssetMovement
    {
        return $this->movements()->latest()->first();
    }

    /**
     * Generate QR code data (just the asset tag)
     */
    public function getQrDataAttribute(): string
    {
        return $this->asset_tag;
    }

    /**
     * Calculate depreciation history (Straight Line Method)
     */
    public function getDepreciationHistory(): array
    {
        if (!$this->purchase_price || !$this->useful_life_years || $this->useful_life_years <= 0 || !$this->purchase_date) {
            return [];
        }

        $cost = $this->purchase_price;
        $residual = $this->residual_value ?? 0;
        $usefulLife = $this->useful_life_years;
        $annualDepreciation = ($cost - $residual) / $usefulLife;

        $history = [];
        $currentValue = $cost;
        $purchaseYear = $this->purchase_date->year;

        for ($i = 0; $i <= $usefulLife; $i++) {
            $year = $purchaseYear + $i;
            
            // Year 0 is acquisition
            if ($i === 0) {
                 $history[] = [
                    'year' => $year,
                    'book_value' => $cost,
                    'depreciation_expense' => 0,
                    'accumulated_depreciation' => 0,
                 ];
                 continue;
            }

            $currentValue -= $annualDepreciation;
            // Ensure we don't go below residual
            if ($currentValue < $residual) $currentValue = $residual;

            $accumulated = $cost - $currentValue;

            $history[] = [
                'year' => $year,
                'book_value' => round(max($currentValue, $residual), 2),
                'depreciation_expense' => round($annualDepreciation, 2),
                'accumulated_depreciation' => round($accumulated, 2),
            ];
        }

        return $history;
    }
}
