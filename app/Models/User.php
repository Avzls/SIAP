<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'hris_user_id',
        'nopeg',
        'name',
        'email',
        'password',
        'id_level',
        'is_active',
        'last_synced_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'last_synced_at' => 'datetime',
            'id_level' => 'integer',
        ];
    }

    // =========================================
    // Relationships
    // =========================================

    /**
     * Assets currently assigned to this user
     */
    public function assets(): HasMany
    {
        return $this->hasMany(Asset::class, 'current_user_id');
    }

    /**
     * Asset requests created by this user
     */
    public function requests(): HasMany
    {
        return $this->hasMany(AssetRequest::class, 'requester_id');
    }

    /**
     * Approval tasks assigned to this user
     */
    public function approvals(): HasMany
    {
        return $this->hasMany(AssetRequestApproval::class, 'approver_id');
    }

    /**
     * Movements performed by this user
     */
    public function performedMovements(): HasMany
    {
        return $this->hasMany(AssetMovement::class, 'performed_by');
    }

    // =========================================
    // Scopes
    // =========================================

    /**
     * Scope: Only active users
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: Users who can approve (level >= 9)
     */
    public function scopeApprovers($query)
    {
        return $query->where('id_level', '>=', 9)->active();
    }

    /**
     * Scope: Asset admins (level == 3)
     */
    public function scopeAssetAdmins($query)
    {
        return $query->where('id_level', 3)->active();
    }

    // =========================================
    // Helpers
    // =========================================

    /**
     * Check if user is an approver
     */
    public function isApprover(): bool
    {
        return $this->id_level >= 9;
    }

    /**
     * Check if user is an asset admin
     */
    public function isAssetAdmin(): bool
    {
        return $this->id_level === 3;
    }

    /**
     * Get pending approval count
     */
    public function getPendingApprovalCountAttribute(): int
    {
        return $this->approvals()->where('status', 'PENDING')->count();
    }
}
