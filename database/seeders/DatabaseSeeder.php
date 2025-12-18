<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Required seeders (run in all environments)
        $this->call([
            RoleSeeder::class,
            MasterDataSeeder::class,
        ]);

        // Development/testing seeders
        if (app()->environment(['local', 'development', 'testing'])) {
            $this->call([
                DevelopmentSeeder::class,
            ]);
        }
    }
}
