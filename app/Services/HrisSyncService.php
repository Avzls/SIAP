<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Laravel\Sanctum\PersonalAccessToken;

class HrisSyncService
{
    /**
     * Sync users from HRIS database
     *
     * @param bool $dryRun If true, no changes will be made
     * @return array Statistics about the sync operation
     */
    public function syncUsers(bool $dryRun = false): array
    {
        $stats = [
            'created' => 0,
            'updated' => 0,
            'deactivated' => 0,
            'reactivated' => 0,
            'skipped' => 0,
            'errors' => 0,
        ];

        Log::channel('audit')->info('HRIS Sync started', ['dry_run' => $dryRun]);

        try {
            // Fetch users from HRIS (READ ONLY connection)
            $hrisUsers = $this->fetchHrisUsers();

            if ($hrisUsers->isEmpty()) {
                Log::channel('audit')->warning('HRIS Sync: No users found in HRIS database');
                return $stats;
            }

            $hrisUserIds = $hrisUsers->pluck('id')->toArray();

            Log::channel('audit')->info('HRIS Sync: Fetched users', [
                'total_hris_users' => count($hrisUserIds),
            ]);

            if ($dryRun) {
                // In dry run, just count what would happen
                return $this->calculateDryRunStats($hrisUsers, $hrisUserIds);
            }

            // Perform actual sync within transaction
            DB::transaction(function () use ($hrisUsers, $hrisUserIds, &$stats) {
                foreach ($hrisUsers as $hris) {
                    try {
                        $this->syncUser($hris, $stats);
                    } catch (\Exception $e) {
                        $stats['errors']++;
                        Log::channel('audit')->error('HRIS Sync: Error syncing user', [
                            'hris_id' => $hris->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }

                // Deactivate users no longer in HRIS
                $this->deactivateMissingUsers($hrisUserIds, $stats);
            });

            Log::channel('audit')->info('HRIS Sync completed', $stats);

        } catch (\Exception $e) {
            Log::channel('audit')->error('HRIS Sync failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }

        return $stats;
    }

    /**
     * Fetch users from HRIS database
     */
    protected function fetchHrisUsers()
    {
        // Columns from your HRIS: id, name, email, nopegawai
        // Note: id_level doesn't exist in HRIS, will use default value
        return DB::connection('hris')
            ->table('users')
            ->select([
                'id',
                'name', 
                'email',
                DB::raw("nopegawai as nopeg"),
                DB::raw("1 as id_level"), // Default level, adjust if you have level column
            ])
            ->whereNotNull('email')
            ->get();
    }

    /**
     * Sync a single user from HRIS
     */
    protected function syncUser(object $hris, array &$stats): void
    {
        $existingUser = User::where('hris_user_id', $hris->id)->first();

        $userData = [
            'name' => $hris->name,
            'email' => $hris->email,
            'nopeg' => $hris->nopeg,
            'id_level' => $hris->id_level,
            'is_active' => true,
            'last_synced_at' => now(),
        ];

        if ($existingUser) {
            // Check if user was previously inactive (reactivation)
            $wasInactive = !$existingUser->is_active;

            $existingUser->update($userData);

            if ($wasInactive) {
                $stats['reactivated']++;
                Log::channel('audit')->info('User reactivated', [
                    'user_id' => $existingUser->id,
                    'hris_user_id' => $hris->id,
                ]);
            } else {
                $stats['updated']++;
            }

            $user = $existingUser;
        } else {
            // Create new user with default password
            $user = User::create(array_merge(
                ['hris_user_id' => $hris->id, 'password' => Hash::make('password123')], 
                $userData
            ));
            $stats['created']++;

            Log::channel('audit')->info('User created from HRIS', [
                'user_id' => $user->id,
                'hris_user_id' => $hris->id,
                'email' => $hris->email,
            ]);
        }

        // Assign role based on level
        $role = $this->getRoleByLevel($hris->id_level);
        $user->syncRoles([$role]);
    }

    /**
     * Deactivate users that are no longer in HRIS
     */
    protected function deactivateMissingUsers(array $hrisUserIds, array &$stats): void
    {
        $usersToDeactivate = User::whereNotIn('hris_user_id', $hrisUserIds)
            ->where('is_active', true)
            ->get();

        foreach ($usersToDeactivate as $user) {
            $user->update(['is_active' => false]);

            // Revoke all Sanctum tokens immediately
            PersonalAccessToken::where('tokenable_id', $user->id)
                ->where('tokenable_type', User::class)
                ->delete();

            $stats['deactivated']++;

            Log::channel('audit')->warning('User deactivated from HRIS', [
                'user_id' => $user->id,
                'hris_user_id' => $user->hris_user_id,
                'email' => $user->email,
            ]);
        }
    }

    /**
     * Calculate what would happen in a dry run
     */
    protected function calculateDryRunStats($hrisUsers, array $hrisUserIds): array
    {
        $stats = [
            'created' => 0,
            'updated' => 0,
            'deactivated' => 0,
            'reactivated' => 0,
            'skipped' => 0,
            'errors' => 0,
        ];

        foreach ($hrisUsers as $hris) {
            $existingUser = User::where('hris_user_id', $hris->id)->first();

            if ($existingUser) {
                if (!$existingUser->is_active) {
                    $stats['reactivated']++;
                } else {
                    $stats['updated']++;
                }
            } else {
                $stats['created']++;
            }
        }

        // Count users that would be deactivated
        $stats['deactivated'] = User::whereNotIn('hris_user_id', $hrisUserIds)
            ->where('is_active', true)
            ->count();

        return $stats;
    }

    /**
     * Determine role based on HRIS level
     */
    protected function getRoleByLevel(int $level): string
    {
        return match (true) {
            $level === 3 => 'asset_admin',
            $level >= 9 => 'approver',
            default => 'employee',
        };
    }
}
