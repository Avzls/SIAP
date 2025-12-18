<?php

namespace App\Http\Controllers\Api;

use App\Enums\RequestType;
use App\Http\Controllers\Controller;
use App\Http\Resources\AssetRequestResource;
use App\Models\AssetRequest;
use App\Models\AssetRequestItem;
use App\Services\AssetRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AssetRequestController extends Controller
{
    public function __construct(
        protected AssetRequestService $requestService
    ) {}

    /**
     * List requests (own requests for employees, all for admins)
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();
        
        $query = AssetRequest::with(['requester', 'items.category', 'items.asset', 'approvals.approver']);

        // Non-admins can only see their own requests
        if (!$user->hasRole(['asset_admin', 'super_admin', 'approver'])) {
            $query->where('requester_id', $user->id);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by type
        if ($request->filled('type')) {
            $query->where('request_type', $request->type);
        }

        // Filter by requester (for admins)
        if ($request->filled('requester_id') && $user->hasRole(['asset_admin', 'super_admin'])) {
            $query->where('requester_id', $request->requester_id);
        }

        $requests = $query->orderByDesc('created_at')
            ->paginate($request->get('per_page', 15));

        return AssetRequestResource::collection($requests);
    }

    /**
     * Create a new request
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'request_type' => 'required|in:NEW,RETURN,REPAIR,TRANSFER',
            'justification' => 'nullable|string|max:2000',
            'items' => 'required|array|min:1',
            'items.*.category_id' => 'required_if:request_type,NEW|exists:asset_categories,id',
            'items.*.quantity' => 'nullable|integer|min:1',
            'items.*.specifications' => 'nullable|string',
            'items.*.asset_id' => 'required_unless:request_type,NEW|exists:assets,id',
            'items.*.transfer_to_user_id' => 'required_if:request_type,TRANSFER|exists:users,id',
            'items.*.notes' => 'nullable|string',
        ]);

        $assetRequest = $this->requestService->create(
            $request->user(),
            RequestType::from($validated['request_type']),
            $validated['justification'] ?? null
        );

        // Add items
        foreach ($validated['items'] as $itemData) {
            AssetRequestItem::create([
                'request_id' => $assetRequest->id,
                'category_id' => $itemData['category_id'] ?? null,
                'quantity' => $itemData['quantity'] ?? 1,
                'specifications' => $itemData['specifications'] ?? null,
                'asset_id' => $itemData['asset_id'] ?? null,
                'transfer_to_user_id' => $itemData['transfer_to_user_id'] ?? null,
                'notes' => $itemData['notes'] ?? null,
            ]);
        }

        return response()->json([
            'message' => 'Request created successfully',
            'data' => new AssetRequestResource($assetRequest->load(['items', 'requester'])),
        ], 201);
    }

    /**
     * Get request details
     */
    public function show(AssetRequest $request): AssetRequestResource
    {
        $this->authorize('view', $request);

        return new AssetRequestResource(
            $request->load([
                'requester',
                'items.category',
                'items.asset',
                'items.transferToUser',
                'items.fulfilledAsset',
                'approvals.approver',
                'approvals.decider',
                'fulfiller',
            ])
        );
    }

    /**
     * Update draft request
     */
    public function update(Request $httpRequest, AssetRequest $request): JsonResponse
    {
        $this->authorize('update', $request);

        if (!$request->canEdit()) {
            return response()->json([
                'message' => 'Request cannot be edited in its current status',
            ], 422);
        }

        $validated = $httpRequest->validate([
            'justification' => 'nullable|string|max:2000',
        ]);

        $request->update($validated);

        return response()->json([
            'message' => 'Request updated successfully',
            'data' => new AssetRequestResource($request->fresh(['items', 'requester'])),
        ]);
    }

    /**
     * Submit request for approval
     */
    public function submit(Request $httpRequest, AssetRequest $request): JsonResponse
    {
        $this->authorize('submit', $request);

        $this->requestService->submit($request);

        return response()->json([
            'message' => 'Request submitted for approval',
            'data' => new AssetRequestResource($request->fresh(['items', 'approvals.approver'])),
        ]);
    }

    /**
     * Cancel request
     */
    public function cancel(Request $httpRequest, AssetRequest $request): JsonResponse
    {
        $this->requestService->cancel($request, $httpRequest->user());

        return response()->json([
            'message' => 'Request cancelled',
        ]);
    }

    /**
     * Delete draft request
     */
    public function destroy(AssetRequest $request): JsonResponse
    {
        $this->authorize('delete', $request);

        if ($request->status->value !== 'DRAFT') {
            return response()->json([
                'message' => 'Only draft requests can be deleted',
            ], 422);
        }

        $request->delete();

        return response()->json([
            'message' => 'Request deleted',
        ]);
    }
}
