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
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            // Assets
            'assets.view',
            'assets.create',
            'assets.update',
            'assets.delete',
            'assets.assign',
            'assets.movements.view',
            
            // Requests
            'requests.view',
            'requests.create',
            'requests.approve',
            'requests.fulfill',
            
            // Reports
            'reports.view',
            
            // Admin
            'admin.users.view',
            'admin.settings',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Create roles with permissions
        
        // Employee - basic access
        $employee = Role::firstOrCreate(['name' => 'employee', 'guard_name' => 'web']);
        $employee->syncPermissions([
            'assets.view',
            'requests.view',
            'requests.create',
        ]);

        // Approver - can approve requests
        $approver = Role::firstOrCreate(['name' => 'approver', 'guard_name' => 'web']);
        $approver->syncPermissions([
            'assets.view',
            'requests.view',
            'requests.create',
            'requests.approve',
        ]);

        // Asset Admin - can manage assets and fulfill requests
        $assetAdmin = Role::firstOrCreate(['name' => 'asset_admin', 'guard_name' => 'web']);
        $assetAdmin->syncPermissions([
            'assets.view',
            'assets.create',
            'assets.update',
            'assets.assign',
            'assets.movements.view',
            'requests.view',
            'requests.create',
            'requests.fulfill',
            'reports.view',
        ]);

        // Super Admin - full access
        $superAdmin = Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);
        $superAdmin->syncPermissions(Permission::all());
    }
}
