<?php

namespace Database\Seeders;

use App\Models\AssetCategory;
use App\Models\AssetLocation;
use App\Models\User;
use Illuminate\Database\Seeder;

class MasterDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Asset Categories
        $categories = [
            ['code' => 'IT', 'name' => 'IT Equipment', 'description' => 'Computers, laptops, monitors, peripherals'],
            ['code' => 'MOBILE', 'name' => 'Mobile Devices', 'description' => 'Smartphones, tablets'],
            ['code' => 'OFFICE', 'name' => 'Office Equipment', 'description' => 'Desks, chairs, cabinets'],
            ['code' => 'VEHICLE', 'name' => 'Vehicles', 'description' => 'Cars, motorcycles, trucks'],
            ['code' => 'TOOL', 'name' => 'Tools & Equipment', 'description' => 'Hand tools, power tools, machinery'],
            ['code' => 'NETWORK', 'name' => 'Network Equipment', 'description' => 'Routers, switches, access points'],
            ['code' => 'AV', 'name' => 'Audio Visual', 'description' => 'Projectors, cameras, microphones'],
        ];

        foreach ($categories as $category) {
            AssetCategory::firstOrCreate(
                ['code' => $category['code']],
                $category
            );
        }

        // Asset Locations
        $locations = [
            ['code' => 'HQ-F1', 'name' => 'Head Office - Floor 1', 'building' => 'Head Office', 'floor' => '1'],
            ['code' => 'HQ-F2', 'name' => 'Head Office - Floor 2', 'building' => 'Head Office', 'floor' => '2'],
            ['code' => 'HQ-F3', 'name' => 'Head Office - Floor 3', 'building' => 'Head Office', 'floor' => '3'],
            ['code' => 'WH-A', 'name' => 'Warehouse A', 'building' => 'Warehouse', 'address' => 'Industrial Area'],
            ['code' => 'WH-B', 'name' => 'Warehouse B', 'building' => 'Warehouse', 'address' => 'Industrial Area'],
            ['code' => 'IT-ROOM', 'name' => 'IT Server Room', 'building' => 'Head Office', 'floor' => '1', 'room' => 'SR-01'],
            ['code' => 'STORAGE', 'name' => 'Asset Storage', 'building' => 'Head Office', 'floor' => 'B1'],
        ];

        foreach ($locations as $location) {
            AssetLocation::firstOrCreate(
                ['code' => $location['code']],
                $location
            );
        }
    }
}
