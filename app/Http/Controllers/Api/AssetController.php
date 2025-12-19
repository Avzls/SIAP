<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AssetResource;
use App\Models\Asset;
use App\Models\AssetCategory;
use App\Services\AssetMovementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AssetController extends Controller
{
    public function __construct(
        protected AssetMovementService $movementService
    ) {}

    /**
     * List all assets with filters
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Asset::with(['category', 'currentUser', 'currentLocation']);

        // Apply filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('location_id')) {
            $query->where('current_location_id', $request->location_id);
        }

        if ($request->filled('user_id')) {
            $query->where('current_user_id', $request->user_id);
        }

        if ($request->filled('ids')) {
            $ids = explode(',', $request->ids);
            $query->whereIn('id', $ids);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('asset_tag', 'like', "%{$search}%")
                    ->orWhere('serial_number', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $query->orderBy($sortBy, $sortDir);

        $assets = $query->paginate($request->get('per_page', 15));

        return AssetResource::collection($assets);
    }

    /**
     * Create a new asset
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Asset::class);

        $validated = $request->validate([
            'asset_tag' => 'required|string|max:50|unique:assets,asset_tag',
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:asset_categories,id',
            'location_id' => 'nullable|exists:asset_locations,id',
            'brand' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'serial_number' => 'nullable|string|max:255',
            'purchase_date' => 'nullable|date',
            'purchase_price' => 'nullable|numeric|min:0',
            'useful_life_years' => 'nullable|integer|min:0',
            'residual_value' => 'nullable|numeric|min:0',
            'warranty_end' => 'nullable|date',
            'specifications' => 'nullable|array',
            'notes' => 'nullable|string',
        ]);

        $asset = $this->movementService->create(
            $validated,
            $request->user(),
            $validated['location_id'] ?? null
        );

        return response()->json([
            'message' => 'Asset created successfully',
            'data' => new AssetResource($asset->load(['category', 'currentLocation'])),
        ], 201);
    }

    /**
     * Get asset by ID or tag
     */
    public function show(string $identifier): AssetResource
    {
        $asset = Asset::where('id', $identifier)
            ->orWhere('asset_tag', $identifier)
            ->with(['category', 'currentUser', 'currentLocation', 'attachments'])
            ->firstOrFail();

        $this->authorize('view', $asset);

        return new AssetResource($asset);
    }

    /**
     * Update asset details
     */
    public function update(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('update', $asset);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'category_id' => 'sometimes|exists:asset_categories,id',
            'brand' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'serial_number' => 'nullable|string|max:255',
            'purchase_date' => 'nullable|date',
            'purchase_price' => 'nullable|numeric|min:0',
            'useful_life_years' => 'nullable|integer|min:0',
            'residual_value' => 'nullable|numeric|min:0',
            'warranty_end' => 'nullable|date',
            'specifications' => 'nullable|array',
            'notes' => 'nullable|string',
        ]);

        $asset->update($validated);

        return response()->json([
            'message' => 'Asset updated successfully',
            'data' => new AssetResource($asset->fresh(['category', 'currentUser', 'currentLocation'])),
        ]);
    }

    /**
     * Soft delete asset
     */
    public function destroy(Asset $asset): JsonResponse
    {
        $this->authorize('delete', $asset);

        $asset->delete();

        return response()->json([
            'message' => 'Asset deleted successfully',
        ]);
    }

    /**
     * Get available assets (in stock) for a category
     */
    public function available(Request $request): AnonymousResourceCollection
    {
        $query = Asset::inStock()
            ->with(['category', 'currentLocation']);

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        return AssetResource::collection($query->get());
    }

    /**
     * Import assets from CSV file
     */
    public function import(Request $request): JsonResponse
    {
        $this->authorize('create', Asset::class);

        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:5120', // 5MB max
        ]);

        $importService = new \App\Services\AssetImportService();
        $result = $importService->importFromCsv($request->file('file'));

        return response()->json($result, $result['success'] ? 200 : 422);
    }

    /**
     * Download import template
     */
    public function importTemplate(): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $content = \App\Services\AssetImportService::getTemplateContent();
        
        return response()->streamDownload(function () use ($content) {
            echo $content;
        }, 'template_import_aset.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }

    /**
     * Get import template format description
     */
    public function importFormat(): JsonResponse
    {
        return response()->json([
            'columns' => \App\Services\AssetImportService::getTemplateDescription(),
        ]);
    }

    /**
     * Get asset depreciation history
     */
    public function depreciation(Asset $asset): JsonResponse
    {
        $this->authorize('view', $asset);

        return response()->json([
            'asset' => [
                'name' => $asset->name,
                'asset_tag' => $asset->asset_tag,
                'purchase_price' => $asset->purchase_price,
                'useful_life_years' => $asset->useful_life_years,
                'residual_value' => $asset->residual_value,
            ],
            'history' => $asset->getDepreciationHistory(),
        ]);
    }
}

