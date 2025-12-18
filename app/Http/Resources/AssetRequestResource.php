<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssetRequestResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'request_number' => $this->request_number,
            'request_type' => [
                'value' => $this->request_type->value,
                'label' => $this->request_type->label(),
            ],
            'status' => [
                'value' => $this->status->value,
                'label' => $this->status->label(),
                'color' => $this->status->color(),
            ],
            'requester' => $this->whenLoaded('requester', fn() => [
                'id' => $this->requester->id,
                'name' => $this->requester->name,
                'nopeg' => $this->requester->nopeg,
                'email' => $this->requester->email,
            ]),
            'justification' => $this->justification,
            'rejection_reason' => $this->rejection_reason,
            'items' => $this->whenLoaded('items', fn() => 
                $this->items->map(fn($item) => [
                    'id' => $item->id,
                    'category' => $item->category ? [
                        'id' => $item->category->id,
                        'name' => $item->category->name,
                    ] : null,
                    'quantity' => $item->quantity,
                    'specifications' => $item->specifications,
                    'asset' => $item->asset ? [
                        'id' => $item->asset->id,
                        'asset_tag' => $item->asset->asset_tag,
                        'name' => $item->asset->name,
                    ] : null,
                    'transfer_to_user' => $item->transferToUser ? [
                        'id' => $item->transferToUser->id,
                        'name' => $item->transferToUser->name,
                    ] : null,
                    'fulfilled_asset' => $item->fulfilledAsset ? [
                        'id' => $item->fulfilledAsset->id,
                        'asset_tag' => $item->fulfilledAsset->asset_tag,
                        'name' => $item->fulfilledAsset->name,
                    ] : null,
                    'notes' => $item->notes,
                    'description' => $item->description,
                    'is_fulfilled' => $item->isFulfilled(),
                ])
            ),
            'approvals' => $this->whenLoaded('approvals', fn() => 
                $this->approvals->map(fn($approval) => [
                    'id' => $approval->id,
                    'approver' => [
                        'id' => $approval->approver->id,
                        'name' => $approval->approver->name,
                    ],
                    'status' => [
                        'value' => $approval->status->value,
                        'label' => $approval->status->label(),
                        'color' => $approval->status->color(),
                    ],
                    'remarks' => $approval->remarks,
                    'decided_at' => $approval->decided_at?->toIso8601String(),
                ])
            ),
            'fulfiller' => $this->whenLoaded('fulfiller', fn() => [
                'id' => $this->fulfiller->id,
                'name' => $this->fulfiller->name,
            ]),
            'fulfilled_at' => $this->fulfilled_at?->toIso8601String(),
            'fulfillment_notes' => $this->fulfillment_notes,
            'can_edit' => $this->canEdit(),
            'can_submit' => $this->canSubmit(),
            'can_cancel' => $this->canCancel(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
