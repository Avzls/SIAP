<?php

namespace App\Http\Controllers\Api;

use App\Enums\RequestStatus;
use App\Enums\RequestType;
use App\Http\Controllers\Controller;
use App\Http\Resources\AssetRequestResource;
use App\Models\Asset;
use App\Models\AssetRequest;
use App\Services\AssetRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AdminController extends Controller
{
    public function __construct(
        protected AssetRequestService $requestService
    ) {}


    /**
     * Get requests pending fulfillment
     */
    public function pendingFulfillment(Request $request): AnonymousResourceCollection
    {
        $requests = AssetRequest::with([
                'requester',
                'items.category',
                'items.asset',
                'approvals.approver',
            ])
            ->where('status', RequestStatus::APPROVED)
            ->orderBy('updated_at')
            ->paginate($request->get('per_page', 15));

        return AssetRequestResource::collection($requests);
    }

    /**
     * Fulfill a NEW asset request (assign assets from stock)
     */
    public function fulfill(Request $httpRequest, AssetRequest $request): JsonResponse
    {
        $this->authorize('fulfill', $request);

        if ($request->request_type !== RequestType::NEW) {
            return response()->json([
                'message' => 'Use specific fulfillment endpoints for non-NEW requests',
            ], 422);
        }

        $validated = $httpRequest->validate([
            'fulfillments' => 'required|array',
            'fulfillments.*.item_id' => 'required|exists:asset_request_items,id',
            'fulfillments.*.asset_id' => 'required|exists:assets,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Transform to item_id => asset_id format
        $itemFulfillments = collect($validated['fulfillments'])
            ->pluck('asset_id', 'item_id')
            ->toArray();

        $this->requestService->fulfill(
            $request,
            $itemFulfillments,
            $httpRequest->user(),
            $validated['notes'] ?? null
        );

        return response()->json([
            'message' => 'Request fulfilled successfully',
            'data' => new AssetRequestResource($request->fresh([
                'items.fulfilledAsset',
                'fulfiller',
            ])),
        ]);
    }

    /**
     * Fulfill a RETURN request
     */
    public function fulfillReturn(Request $httpRequest, AssetRequest $request): JsonResponse
    {
        $this->authorize('fulfill', $request);

        if ($request->request_type !== RequestType::RETURN) {
            return response()->json([
                'message' => 'This endpoint is only for return requests',
            ], 422);
        }

        $validated = $httpRequest->validate([
            'location_id' => 'nullable|exists:asset_locations,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        $this->requestService->fulfillReturn(
            $request,
            $httpRequest->user(),
            $validated['location_id'] ?? null,
            $validated['notes'] ?? null
        );

        return response()->json([
            'message' => 'Return request fulfilled',
            'data' => new AssetRequestResource($request->fresh(['items', 'fulfiller'])),
        ]);
    }

    /**
     * Fulfill a TRANSFER request
     */
    public function fulfillTransfer(Request $httpRequest, AssetRequest $request): JsonResponse
    {
        $this->authorize('fulfill', $request);

        if ($request->request_type !== RequestType::TRANSFER) {
            return response()->json([
                'message' => 'This endpoint is only for transfer requests',
            ], 422);
        }

        $validated = $httpRequest->validate([
            'notes' => 'nullable|string|max:1000',
        ]);

        $this->requestService->fulfillTransfer(
            $request,
            $httpRequest->user(),
            $validated['notes'] ?? null
        );

        return response()->json([
            'message' => 'Transfer request fulfilled',
            'data' => new AssetRequestResource($request->fresh(['items', 'fulfiller'])),
        ]);
    }

    /**
     * Get available assets for fulfillment
     */
    public function availableAssets(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => 'nullable|exists:asset_categories,id',
        ]);

        $query = Asset::inStock()
            ->with(['category', 'currentLocation']);

        if (isset($validated['category_id'])) {
            $query->where('category_id', $validated['category_id']);
        }

        return response()->json([
            'data' => $query->get()->map(fn($asset) => [
                'id' => $asset->id,
                'asset_tag' => $asset->asset_tag,
                'name' => $asset->name,
                'category' => $asset->category->name,
                'location' => $asset->currentLocation?->name,
                'brand' => $asset->brand,
                'model' => $asset->model,
            ]),
        ]);
    }
}
