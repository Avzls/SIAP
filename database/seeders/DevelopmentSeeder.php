<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DevelopmentSeeder extends Seeder
{
    /**
     * Seed demo users for development/testing
     */
    public function run(): void
    {
        $this->command->info('Creating demo users...');

        $users = [
            [
                'hris_user_id' => 'DEMO001',
                'nopeg' => 'ADM001',
                'name' => 'Admin Asset',
                'email' => 'admin@company.com',
                'password' => Hash::make('password123'),
                'id_level' => 3,
                'is_active' => true,
                'role' => 'asset_admin',
            ],
            [
                'hris_user_id' => 'DEMO002',
                'nopeg' => 'MGR001',
                'name' => 'Manager Approver',
                'email' => 'manager@company.com',
                'password' => Hash::make('password123'),
                'id_level' => 9,
                'is_active' => true,
                'role' => 'approver',
            ],
            [
                'hris_user_id' => 'DEMO003',
                'nopeg' => 'EMP001',
                'name' => 'Employee Satu',
                'email' => 'employee1@company.com',
                'password' => Hash::make('password123'),
                'id_level' => 5,
                'is_active' => true,
                'role' => 'employee',
            ],
            [
                'hris_user_id' => 'DEMO004',
                'nopeg' => 'EMP002',
                'name' => 'Employee Dua',
                'email' => 'employee2@company.com',
                'password' => Hash::make('password123'),
                'id_level' => 6,
                'is_active' => true,
                'role' => 'employee',
            ],
            [
                'hris_user_id' => 'DEMO005',
                'nopeg' => 'SPA001',
                'name' => 'Super Admin',
                'email' => 'superadmin@company.com',
                'password' => Hash::make('password123'),
                'id_level' => 10,
                'is_active' => true,
                'role' => 'super_admin',
            ],
        ];

        foreach ($users as $userData) {
            $role = $userData['role'];
            unset($userData['role']);

            $user = User::updateOrCreate(
                ['nopeg' => $userData['nopeg']],
                $userData
            );

            $user->syncRoles([$role]);
        }

        $this->command->info('Created ' . count($users) . ' demo users');
        $this->command->newLine();
        $this->command->info('Demo Accounts:');
        $this->command->table(
            ['Nopeg', 'Name', 'Role', 'Password'],
            [
                ['ADM001', 'Admin Asset', 'asset_admin', 'password123'],
                ['MGR001', 'Manager Approver', 'approver', 'password123'],
                ['EMP001', 'Employee Satu', 'employee', 'password123'],
                ['EMP002', 'Employee Dua', 'employee', 'password123'],
                ['SPA001', 'Super Admin', 'super_admin', 'password123'],
            ]
        );
    }
}
