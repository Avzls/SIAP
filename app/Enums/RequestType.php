<?php

namespace App\Enums;

enum RequestType: string
{
    case NEW = 'NEW';
    case RETURN = 'RETURN';
    case REPAIR = 'REPAIR';
    case TRANSFER = 'TRANSFER';

    public function label(): string
    {
        return match ($this) {
            self::NEW => 'New Asset Request',
            self::RETURN => 'Return Asset',
            self::REPAIR => 'Repair Request',
            self::TRANSFER => 'Transfer Request',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::NEW => 'Request a new asset to be assigned',
            self::RETURN => 'Return an assigned asset back to stock',
            self::REPAIR => 'Request repair for a damaged asset',
            self::TRANSFER => 'Transfer asset to another employee',
        };
    }

    /**
     * Check if this request type requires an existing asset
     */
    public function requiresExistingAsset(): bool
    {
        return in_array($this, [self::RETURN, self::REPAIR, self::TRANSFER]);
    }
}
