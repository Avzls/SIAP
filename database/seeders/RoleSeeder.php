<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create roles with appropriate permissions
        
        // Employee - basic access (can view assets, create requests)
        $employee = Role::firstOrCreate(['name' => 'employee', 'guard_name' => 'web']);
        $employee->syncPermissions([
            'dashboard.view',
            'assets.view',
            'assets.movements.view',
            'assets.depreciation.view',
            'assets.attachments.view',
            'requests.view',
            'requests.create',
            'requests.update',
            'requests.delete',
            'requests.submit',
            'requests.cancel',
            'notifications.view',
            'notifications.mark_read',
            'notifications.delete',
        ]);

        // Approver - can approve requests (manager level)
        $approver = Role::firstOrCreate(['name' => 'approver', 'guard_name' => 'web']);
        $approver->syncPermissions([
            'dashboard.view',
            'assets.view',
            'assets.movements.view',
            'assets.depreciation.view',
            'assets.attachments.view',
            'requests.view',
            'requests.create',
            'requests.update',
            'requests.delete',
            'requests.submit',
            'requests.cancel',
            'approvals.view',
            'approvals.approve',
            'approvals.reject',
            'notifications.view',
            'notifications.mark_read',
            'notifications.delete',
        ]);

        // Asset Admin - can manage assets, fulfill requests, access reports
        $assetAdmin = Role::firstOrCreate(['name' => 'asset_admin', 'guard_name' => 'web']);
        $assetAdmin->syncPermissions([
            'dashboard.view',
            // Assets - full access
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
            // Requests
            'requests.view',
            'requests.create',
            'requests.update',
            'requests.delete',
            'requests.submit',
            'requests.cancel',
            // Fulfillment
            'fulfillment.view',
            'fulfillment.fulfill',
            'fulfillment.fulfill_return',
            'fulfillment.fulfill_transfer',
            // Audit (Stock Opname)
            'audit.view',
            'audit.create',
            'audit.scan',
            'audit.finalize',
            'audit.cancel',
            // Maintenance
            'maintenance.schedules.view',
            'maintenance.schedules.create',
            'maintenance.schedules.delete',
            'maintenance.logs.view',
            'maintenance.logs.create',
            // Reports
            'reports.assets.view',
            'reports.movements.view',
            'reports.requests.view',
            // Master Data
            'categories.view',
            'categories.create',
            'categories.update',
            'categories.delete',
            'locations.view',
            'locations.create',
            'locations.update',
            'locations.delete',
            // Notifications
            'notifications.view',
            'notifications.mark_read',
            'notifications.delete',
        ]);

        // Super Admin - full access to everything
        $superAdmin = Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);
        $superAdmin->syncPermissions(Permission::all());

        $this->command->info('Roles created and permissions assigned successfully!');
    }
}

