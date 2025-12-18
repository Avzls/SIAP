<?php

namespace App\Models;

use App\Enums\RequestStatus;
use App\Enums\RequestType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssetRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'request_number',
        'requester_id',
        'request_type',
        'status',
        'justification',
        'rejection_reason',
        'fulfilled_by',
        'fulfilled_at',
        'fulfillment_notes',
    ];

    protected function casts(): array
    {
        return [
            'request_type' => RequestType::class,
            'status' => RequestStatus::class,
            'fulfilled_at' => 'datetime',
        ];
    }

    /**
     * Boot method to generate request number
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->request_number)) {
                $model->request_number = static::generateRequestNumber();
            }
        });
    }

    /**
     * Generate unique request number
     */
    public static function generateRequestNumber(): string
    {
        $year = now()->format('Y');
        $lastRequest = static::whereYear('created_at', $year)
            ->orderByDesc('id')
            ->first();

        $sequence = $lastRequest ? ((int) substr($lastRequest->request_number, -6)) + 1 : 1;

        return sprintf('REQ-%s-%06d', $year, $sequence);
    }

    // =========================================
    // Relationships
    // =========================================

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function fulfiller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'fulfilled_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(AssetRequestItem::class, 'request_id');
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(AssetRequestApproval::class, 'request_id');
    }

    public function movements(): HasMany
    {
        return $this->hasMany(AssetMovement::class, 'request_id');
    }

    // =========================================
    // Scopes
    // =========================================

    public function scopeByStatus($query, RequestStatus $status)
    {
        return $query->where('status', $status);
    }

    public function scopeDraft($query)
    {
        return $query->where('status', RequestStatus::DRAFT);
    }

    public function scopePendingApproval($query)
    {
        return $query->where('status', RequestStatus::PENDING_APPROVAL);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', RequestStatus::APPROVED);
    }

    public function scopePendingFulfillment($query)
    {
        return $query->whereIn('status', [RequestStatus::APPROVED, RequestStatus::PENDING_FULFILLMENT]);
    }

    public function scopeByRequester($query, int $userId)
    {
        return $query->where('requester_id', $userId);
    }

    // =========================================
    // Helpers
    // =========================================

    /**
     * Check if request can be edited
     */
    public function canEdit(): bool
    {
        return $this->status->canEdit();
    }

    /**
     * Check if request can be submitted
     */
    public function canSubmit(): bool
    {
        return $this->status->canSubmit() && $this->items()->exists();
    }

    /**
     * Check if request can be cancelled
     */
    public function canCancel(): bool
    {
        return $this->status->canCancel();
    }

    /**
     * Get the current pending approval
     */
    public function getCurrentApprovalAttribute(): ?AssetRequestApproval
    {
        return $this->approvals()
            ->where('status', 'PENDING')
            ->orderBy('sequence')
            ->first();
    }

    /**
     * Check if user is the approver for this request
     */
    public function isApprover(User $user): bool
    {
        return $this->approvals()
            ->where('approver_id', $user->id)
            ->where('status', 'PENDING')
            ->exists();
    }
}
