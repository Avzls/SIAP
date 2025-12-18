<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssetRequestItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'request_id',
        'category_id',
        'quantity',
        'specifications',
        'asset_id',
        'transfer_to_user_id',
        'fulfilled_asset_id',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
        ];
    }

    // =========================================
    // Relationships
    // =========================================

    public function request(): BelongsTo
    {
        return $this->belongsTo(AssetRequest::class, 'request_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(AssetCategory::class, 'category_id');
    }

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class, 'asset_id');
    }

    public function transferToUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'transfer_to_user_id');
    }

    public function fulfilledAsset(): BelongsTo
    {
        return $this->belongsTo(Asset::class, 'fulfilled_asset_id');
    }

    // =========================================
    // Helpers
    // =========================================

    /**
     * Check if this item is for a new asset request
     */
    public function isNewAssetRequest(): bool
    {
        return $this->category_id !== null && $this->asset_id === null;
    }

    /**
     * Check if this item references an existing asset
     */
    public function hasExistingAsset(): bool
    {
        return $this->asset_id !== null;
    }

    /**
     * Check if this item has been fulfilled
     */
    public function isFulfilled(): bool
    {
        return $this->fulfilled_asset_id !== null;
    }

    /**
     * Get description for display
     */
    public function getDescriptionAttribute(): string
    {
        if ($this->isNewAssetRequest()) {
            $desc = $this->category?->name ?? 'Unknown Category';
            if ($this->quantity > 1) {
                $desc .= " (x{$this->quantity})";
            }
            return $desc;
        }

        return $this->asset?->name ?? 'Unknown Asset';
    }
}
