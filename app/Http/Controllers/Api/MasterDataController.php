<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AssetCategory;
use App\Models\AssetLocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MasterDataController extends Controller
{
    // =========================================
    // Asset Categories
    // =========================================

    /**
     * List all asset categories
     */
    public function categories(Request $request): JsonResponse
    {
        $query = AssetCategory::withCount('assets');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->boolean('active_only')) {
            $query->active();
        }

        $categories = $query->orderBy('name')->get();

        return response()->json([
            'data' => $categories->map(fn($cat) => [
                'id' => $cat->id,
                'code' => $cat->code,
                'name' => $cat->name,
                'description' => $cat->description,
                'requires_approval' => $cat->requires_approval,
                'is_active' => $cat->is_active,
                'assets_count' => $cat->assets_count,
            ]),
        ]);
    }

    /**
     * Create a new category
     */
    public function storeCategory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:asset_categories,code',
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'requires_approval' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $category = AssetCategory::create($validated);

        return response()->json([
            'message' => 'Kategori berhasil dibuat',
            'data' => $category,
        ], 201);
    }

    /**
     * Update a category
     */
    public function updateCategory(Request $request, AssetCategory $category): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:20', Rule::unique('asset_categories', 'code')->ignore($category->id)],
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'requires_approval' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $category->update($validated);

        return response()->json([
            'message' => 'Kategori berhasil diupdate',
            'data' => $category,
        ]);
    }

    /**
     * Delete a category
     */
    public function destroyCategory(AssetCategory $category): JsonResponse
    {
        if ($category->assets()->exists()) {
            return response()->json([
                'message' => 'Kategori tidak dapat dihapus karena masih memiliki aset',
            ], 422);
        }

        $category->delete();

        return response()->json([
            'message' => 'Kategori berhasil dihapus',
        ]);
    }

    // =========================================
    // Asset Locations
    // =========================================

    /**
     * List all asset locations
     */
    public function locations(Request $request): JsonResponse
    {
        $query = AssetLocation::withCount('assets');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('building', 'like', "%{$search}%");
            });
        }

        if ($request->boolean('active_only')) {
            $query->active();
        }

        $locations = $query->orderBy('name')->get();

        return response()->json([
            'data' => $locations->map(fn($loc) => [
                'id' => $loc->id,
                'code' => $loc->code,
                'name' => $loc->name,
                'building' => $loc->building,
                'floor' => $loc->floor,
                'room' => $loc->room,
                'address' => $loc->address,
                'is_active' => $loc->is_active,
                'assets_count' => $loc->assets_count,
            ]),
        ]);
    }

    /**
     * Create a new location
     */
    public function storeLocation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:asset_locations,code',
            'name' => 'required|string|max:100',
            'building' => 'nullable|string|max:100',
            'floor' => 'nullable|string|max:20',
            'room' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:500',
            'is_active' => 'boolean',
        ]);

        $location = AssetLocation::create($validated);

        return response()->json([
            'message' => 'Lokasi berhasil dibuat',
            'data' => $location,
        ], 201);
    }

    /**
     * Update a location
     */
    public function updateLocation(Request $request, AssetLocation $location): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:20', Rule::unique('asset_locations', 'code')->ignore($location->id)],
            'name' => 'required|string|max:100',
            'building' => 'nullable|string|max:100',
            'floor' => 'nullable|string|max:20',
            'room' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:500',
            'is_active' => 'boolean',
        ]);

        $location->update($validated);

        return response()->json([
            'message' => 'Lokasi berhasil diupdate',
            'data' => $location,
        ]);
    }

    /**
     * Delete a location
     */
    public function destroyLocation(AssetLocation $location): JsonResponse
    {
        if ($location->assets()->exists()) {
            return response()->json([
                'message' => 'Lokasi tidak dapat dihapus karena masih memiliki aset',
            ], 422);
        }

        $location->delete();

        return response()->json([
            'message' => 'Lokasi berhasil dihapus',
        ]);
    }
}
