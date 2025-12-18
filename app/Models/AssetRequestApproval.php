<?php

namespace App\Models;

use App\Enums\ApprovalStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssetRequestApproval extends Model
{
    use HasFactory;

    protected $fillable = [
        'request_id',
        'approver_id',
        'sequence',
        'status',
        'remarks',
        'decided_by',
        'decided_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => ApprovalStatus::class,
            'sequence' => 'integer',
            'decided_at' => 'datetime',
        ];
    }

    // =========================================
    // Relationships
    // =========================================

    public function request(): BelongsTo
    {
        return $this->belongsTo(AssetRequest::class, 'request_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }

    public function decider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'decided_by');
    }

    // =========================================
    // Scopes
    // =========================================

    public function scopePending($query)
    {
        return $query->where('status', ApprovalStatus::PENDING);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', ApprovalStatus::APPROVED);
    }

    public function scopeRejected($query)
    {
        return $query->where('status', ApprovalStatus::REJECTED);
    }

    public function scopeForApprover($query, int $userId)
    {
        return $query->where('approver_id', $userId);
    }

    // =========================================
    // Helpers
    // =========================================

    /**
     * Check if approval is pending
     */
    public function isPending(): bool
    {
        return $this->status === ApprovalStatus::PENDING;
    }

    /**
     * Check if approval was approved
     */
    public function isApproved(): bool
    {
        return $this->status === ApprovalStatus::APPROVED;
    }

    /**
     * Check if approval was rejected
     */
    public function isRejected(): bool
    {
        return $this->status === ApprovalStatus::REJECTED;
    }

    /**
     * Approve this request
     */
    public function approve(User $approver, ?string $remarks = null): void
    {
        $this->update([
            'status' => ApprovalStatus::APPROVED,
            'remarks' => $remarks,
            'decided_by' => $approver->id,
            'decided_at' => now(),
        ]);
    }

    /**
     * Reject this request
     */
    public function reject(User $approver, string $reason): void
    {
        $this->update([
            'status' => ApprovalStatus::REJECTED,
            'remarks' => $reason,
            'decided_by' => $approver->id,
            'decided_at' => now(),
        ]);
    }
}
