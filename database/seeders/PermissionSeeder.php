<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Define all permissions grouped by module
        $permissions = [
            // Dashboard
            'dashboard.view',

            // Assets Module
            'assets.view',
            'assets.create',
            'assets.update',
            'assets.delete',
            'assets.assign',
            'assets.return',
            'assets.transfer',
            'assets.retire',
            'assets.mark_lost',
            'assets.mark_found',
            'assets.movements.view',
            'assets.depreciation.view',
            'assets.attachments.view',
            'assets.attachments.upload',
            'assets.attachments.delete',
            'assets.import',

            // Requests Module
            'requests.view',
            'requests.create',
            'requests.update',
            'requests.delete',
            'requests.submit',
            'requests.cancel',

            // Approvals Module
            'approvals.view',
            'approvals.approve',
            'approvals.reject',

            // Fulfillment Module (Admin)
            'fulfillment.view',
            'fulfillment.fulfill',
            'fulfillment.fulfill_return',
            'fulfillment.fulfill_transfer',

            // Stock Opname (Audit) Module
            'audit.view',
            'audit.create',
            'audit.scan',
            'audit.finalize',
            'audit.cancel',

            // Maintenance Module
            'maintenance.schedules.view',
            'maintenance.schedules.create',
            'maintenance.schedules.delete',
            'maintenance.logs.view',
            'maintenance.logs.create',

            // Reports Module
            'reports.assets.view',
            'reports.movements.view',
            'reports.requests.view',

            // Master Data - Categories
            'categories.view',
            'categories.create',
            'categories.update',
            'categories.delete',

            // Master Data - Locations
            'locations.view',
            'locations.create',
            'locations.update',
            'locations.delete',

            // Admin - User Management
            'users.view',
            'users.update',
            'users.assign_roles',

            // Admin - Role Management
            'roles.view',
            'roles.create',
            'roles.update',
            'roles.delete',
            'roles.assign_permissions',

            // Notifications
            'notifications.view',
            'notifications.mark_read',
            'notifications.delete',
        ];

        // Create all permissions
        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web'
            ]);
        }

        $this->command->info('Permissions created successfully!');
        $this->command->info('Total permissions: ' . count($permissions));
    }
}
