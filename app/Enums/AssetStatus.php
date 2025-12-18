<?php

namespace App\Enums;

enum AssetStatus: string
{
    case IN_STOCK = 'IN_STOCK';
    case ASSIGNED = 'ASSIGNED';
    case IN_REPAIR = 'IN_REPAIR';
    case LOST = 'LOST';
    case RETIRED = 'RETIRED';
    case DISPOSED = 'DISPOSED';

    public function label(): string
    {
        return match ($this) {
            self::IN_STOCK => 'In Stock',
            self::ASSIGNED => 'Assigned',
            self::IN_REPAIR => 'In Repair',
            self::LOST => 'Lost',
            self::RETIRED => 'Retired',
            self::DISPOSED => 'Disposed',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::IN_STOCK => 'success',
            self::ASSIGNED => 'primary',
            self::IN_REPAIR => 'warning',
            self::LOST => 'error',
            self::RETIRED => 'secondary',
            self::DISPOSED => 'secondary',
        };
    }

    /**
     * Check if asset can be assigned
     */
    public function canBeAssigned(): bool
    {
        return $this === self::IN_STOCK;
    }

    /**
     * Check if asset can be returned
     */
    public function canBeReturned(): bool
    {
        return $this === self::ASSIGNED;
    }
}
