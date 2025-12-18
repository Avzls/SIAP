<?php

namespace App\Enums;

enum MovementType: string
{
    case CREATE = 'CREATE';
    case ASSIGN = 'ASSIGN';
    case RETURN = 'RETURN';
    case TRANSFER = 'TRANSFER';
    case REPAIR_OUT = 'REPAIR_OUT';
    case REPAIR_IN = 'REPAIR_IN';
    case LOST = 'LOST';
    case FOUND = 'FOUND';
    case RETIRE = 'RETIRE';
    case DISPOSE = 'DISPOSE';
    case UPDATE = 'UPDATE';

    public function label(): string
    {
        return match ($this) {
            self::CREATE => 'Created',
            self::ASSIGN => 'Assigned',
            self::RETURN => 'Returned',
            self::TRANSFER => 'Transferred',
            self::REPAIR_OUT => 'Sent for Repair',
            self::REPAIR_IN => 'Returned from Repair',
            self::LOST => 'Marked as Lost',
            self::FOUND => 'Found',
            self::RETIRE => 'Retired',
            self::DISPOSE => 'Disposed',
            self::UPDATE => 'Updated',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::CREATE => 'plus-circle',
            self::ASSIGN => 'user-plus',
            self::RETURN => 'arrow-left',
            self::TRANSFER => 'arrows-right-left',
            self::REPAIR_OUT => 'wrench',
            self::REPAIR_IN => 'check-circle',
            self::LOST => 'exclamation-triangle',
            self::FOUND => 'search',
            self::RETIRE => 'archive',
            self::DISPOSE => 'trash',
            self::UPDATE => 'edit',
        };
    }
}
