<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockOpnameDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'stock_opname_id',
        'asset_id',
        'status', // FOUND, MISSING, UNLISTED
        'notes',
        'scanned_at',
        'scanned_by'
    ];

    protected $casts = [
        'scanned_at' => 'datetime',
    ];

    public function stockOpname()
    {
        return $this->belongsTo(StockOpname::class);
    }

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }

    public function scanner()
    {
        return $this->belongsTo(User::class, 'scanned_by');
    }
}
