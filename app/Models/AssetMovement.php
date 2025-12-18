<?php

namespace App\Models;

use App\Enums\MovementType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * APPEND-ONLY MODEL
 * 
 * This model should NEVER be updated or deleted.
 * All state changes are recorded as new rows.
 */
class AssetMovement extends Model
{
    use HasFactory;

    /**
     * Disable timestamps auto-update since this is append-only
     */
    public $timestamps = false;

    protected $fillable = [
        'asset_id',
        'movement_type',
        'from_status',
        'to_status',
        'from_user_id',
        'to_user_id',
        'from_location_id',
        'to_location_id',
        'performed_by',
        'request_id',
        'notes',
        'metadata',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'movement_type' => MovementType::class,
            'metadata' => 'array',
            'created_at' => 'datetime',
        ];
    }

    /**
     * Boot method to set created_at on create
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            $model->created_at = $model->created_at ?? now();
        });

        // Prevent updates and deletes
        static::updating(function ($model) {
            throw new \RuntimeException('AssetMovement records cannot be updated. This is an append-only audit table.');
        });

        static::deleting(function ($model) {
            throw new \RuntimeException('AssetMovement records cannot be deleted. This is an append-only audit table.');
        });
    }

    // =========================================
    // Relationships
    // =========================================

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function fromUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'from_user_id');
    }

    public function toUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'to_user_id');
    }

    public function fromLocation(): BelongsTo
    {
        return $this->belongsTo(AssetLocation::class, 'from_location_id');
    }

    public function toLocation(): BelongsTo
    {
        return $this->belongsTo(AssetLocation::class, 'to_location_id');
    }

    public function performer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    public function request(): BelongsTo
    {
        return $this->belongsTo(AssetRequest::class, 'request_id');
    }

    // =========================================
    // Scopes
    // =========================================

    public function scopeByType($query, MovementType $type)
    {
        return $query->where('movement_type', $type);
    }

    public function scopeByAsset($query, int $assetId)
    {
        return $query->where('asset_id', $assetId);
    }

    public function scopeByPerformer($query, int $userId)
    {
        return $query->where('performed_by', $userId);
    }

    public function scopeInDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    // =========================================
    // Helpers
    // =========================================

    /**
     * Get a summary of the movement for display
     */
    public function getSummaryAttribute(): string
    {
        $type = $this->movement_type->label();
        
        return match ($this->movement_type) {
            MovementType::ASSIGN => "{$type} to {$this->toUser?->name}",
            MovementType::RETURN => "{$type} from {$this->fromUser?->name}",
            MovementType::TRANSFER => "{$type} from {$this->fromUser?->name} to {$this->toUser?->name}",
            default => $type,
        };
    }
}
