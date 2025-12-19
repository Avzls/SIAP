<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'link',
        'notifiable_type',
        'notifiable_id',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    // =========================================
    // Relationships
    // =========================================

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function notifiable(): MorphTo
    {
        return $this->morphTo();
    }

    // =========================================
    // Scopes
    // =========================================

    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    public function scopeRead($query)
    {
        return $query->whereNotNull('read_at');
    }

    // =========================================
    // Helpers
    // =========================================

    public function markAsRead(): void
    {
        if (!$this->read_at) {
            $this->update(['read_at' => now()]);
        }
    }

    public function isRead(): bool
    {
        return $this->read_at !== null;
    }

    // =========================================
    // Static Factory Methods
    // =========================================

    /**
     * Get type label safely
     */
    private static function getTypeLabel($request): string
    {
        try {
            // AssetRequest uses request_type, not type
            $type = $request->request_type ?? $request->type ?? null;
            
            // First check if type is null
            if ($type === null) {
                return 'Aset';
            }
            
            // Handle enum with label() method
            if (is_object($type) && method_exists($type, 'label')) {
                return $type->label();
            }
            // Handle enum with value property
            if (is_object($type) && property_exists($type, 'value')) {
                return $type->value;
            }
            // Fallback - try to cast to string
            return (string) $type;
        } catch (\Exception $e) {
            Log::error('getTypeLabel error: ' . $e->getMessage());
            return 'Aset';
        }
    }

    /**
     * Create notification for request created (for approvers)
     */
    public static function notifyRequestCreated($request, array $approverIds): void
    {
        $typeLabel = static::getTypeLabel($request);
        $requesterName = $request->requester?->name ?? 'Seseorang';

        foreach ($approverIds as $userId) {
            try {
                static::create([
                    'user_id' => $userId,
                    'type' => 'request_created',
                    'title' => 'Permintaan Baru',
                    'message' => "{$requesterName} membuat permintaan {$typeLabel}",
                    'link' => "/requests/{$request->id}",
                    'notifiable_type' => get_class($request),
                    'notifiable_id' => $request->id,
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to create notification: ' . $e->getMessage());
            }
        }
    }

    /**
     * Create notification for request approved (for requester)
     */
    public static function notifyRequestApproved($request): void
    {
        try {
            static::create([
                'user_id' => $request->requester_id,
                'type' => 'request_approved',
                'title' => 'Permintaan Disetujui',
                'message' => 'Permintaan Anda telah disetujui',
                'link' => "/requests/{$request->id}",
                'notifiable_type' => get_class($request),
                'notifiable_id' => $request->id,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create approval notification: ' . $e->getMessage());
        }
    }

    /**
     * Create notification for request rejected (for requester)
     */
    public static function notifyRequestRejected($request, string $reason): void
    {
        try {
            $typeLabel = static::getTypeLabel($request);
            $shortReason = Str::limit($reason, 50);
            
            static::create([
                'user_id' => $request->requester_id,
                'type' => 'request_rejected',
                'title' => 'Permintaan Ditolak',
                'message' => "Permintaan {$typeLabel} Anda ditolak: {$shortReason}",
                'link' => "/requests/{$request->id}",
                'notifiable_type' => get_class($request),
                'notifiable_id' => $request->id,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create rejection notification: ' . $e->getMessage());
        }
    }

    /**
     * Create notification for request fulfilled (for requester)
     */
    public static function notifyRequestFulfilled($request): void
    {
        try {
            $typeLabel = static::getTypeLabel($request);
            
            static::create([
                'user_id' => $request->requester_id,
                'type' => 'request_fulfilled',
                'title' => 'Permintaan Dipenuhi',
                'message' => "Permintaan {$typeLabel} Anda telah dipenuhi",
                'link' => "/requests/{$request->id}",
                'notifiable_type' => get_class($request),
                'notifiable_id' => $request->id,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create fulfillment notification: ' . $e->getMessage());
        }
    }
}
