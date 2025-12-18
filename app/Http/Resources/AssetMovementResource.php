<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssetMovementResource extends JsonResource
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
            'asset' => $this->whenLoaded('asset', fn() => [
                'id' => $this->asset->id,
                'asset_tag' => $this->asset->asset_tag,
                'name' => $this->asset->name,
            ]),
            'movement_type' => [
                'value' => $this->movement_type->value,
                'label' => $this->movement_type->label(),
                'icon' => $this->movement_type->icon(),
            ],
            'from_status' => $this->from_status,
            'to_status' => $this->to_status,
            'from_user' => $this->whenLoaded('fromUser', fn() => [
                'id' => $this->fromUser->id,
                'name' => $this->fromUser->name,
                'nopeg' => $this->fromUser->nopeg,
            ]),
            'to_user' => $this->whenLoaded('toUser', fn() => [
                'id' => $this->toUser->id,
                'name' => $this->toUser->name,
                'nopeg' => $this->toUser->nopeg,
            ]),
            'from_location' => $this->whenLoaded('fromLocation', fn() => [
                'id' => $this->fromLocation->id,
                'name' => $this->fromLocation->name,
            ]),
            'to_location' => $this->whenLoaded('toLocation', fn() => [
                'id' => $this->toLocation->id,
                'name' => $this->toLocation->name,
            ]),
            'performer' => $this->whenLoaded('performer', fn() => [
                'id' => $this->performer->id,
                'name' => $this->performer->name,
            ]),
            'request_id' => $this->request_id,
            'notes' => $this->notes,
            'metadata' => $this->metadata,
            'summary' => $this->summary,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
