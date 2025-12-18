<?php

namespace App\Enums;

enum RequestStatus: string
{
    case DRAFT = 'DRAFT';
    case SUBMITTED = 'SUBMITTED';
    case PENDING_APPROVAL = 'PENDING_APPROVAL';
    case APPROVED = 'APPROVED';
    case REJECTED = 'REJECTED';
    case PENDING_FULFILLMENT = 'PENDING_FULFILLMENT';
    case FULFILLED = 'FULFILLED';
    case CLOSED = 'CLOSED';
    case CANCELLED = 'CANCELLED';

    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Draft',
            self::SUBMITTED => 'Submitted',
            self::PENDING_APPROVAL => 'Pending Approval',
            self::APPROVED => 'Approved',
            self::REJECTED => 'Rejected',
            self::PENDING_FULFILLMENT => 'Pending Fulfillment',
            self::FULFILLED => 'Fulfilled',
            self::CLOSED => 'Closed',
            self::CANCELLED => 'Cancelled',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::DRAFT => 'secondary',
            self::SUBMITTED => 'info',
            self::PENDING_APPROVAL => 'warning',
            self::APPROVED => 'success',
            self::REJECTED => 'error',
            self::PENDING_FULFILLMENT => 'warning',
            self::FULFILLED => 'success',
            self::CLOSED => 'secondary',
            self::CANCELLED => 'secondary',
        };
    }

    /**
     * Check if request can be edited
     */
    public function canEdit(): bool
    {
        return $this === self::DRAFT;
    }

    /**
     * Check if request can be submitted
     */
    public function canSubmit(): bool
    {
        return $this === self::DRAFT;
    }

    /**
     * Check if request can be cancelled
     */
    public function canCancel(): bool
    {
        return in_array($this, [self::DRAFT, self::SUBMITTED, self::PENDING_APPROVAL]);
    }

    /**
     * Check if request is in a final state
     */
    public function isFinal(): bool
    {
        return in_array($this, [self::FULFILLED, self::CLOSED, self::CANCELLED, self::REJECTED]);
    }
}
