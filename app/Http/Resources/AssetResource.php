<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssetResource extends JsonResource
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
            'asset_tag' => $this->asset_tag,
            'name' => $this->name,
            'status' => [
                'value' => $this->status->value,
                'label' => $this->status->label(),
                'color' => $this->status->color(),
            ],
            'category' => $this->whenLoaded('category', fn() => [
                'id' => $this->category->id,
                'code' => $this->category->code,
                'name' => $this->category->name,
            ]),
            'current_user' => $this->whenLoaded('currentUser', fn() => [
                'id' => $this->currentUser->id,
                'name' => $this->currentUser->name,
                'nopeg' => $this->currentUser->nopeg,
            ]),
            'current_location' => $this->whenLoaded('currentLocation', fn() => [
                'id' => $this->currentLocation->id,
                'code' => $this->currentLocation->code,
                'name' => $this->currentLocation->name,
            ]),
            'brand' => $this->brand,
            'model' => $this->model,
            'serial_number' => $this->serial_number,
            'purchase_date' => $this->purchase_date?->format('Y-m-d'),
            'purchase_price' => $this->purchase_price,
            'warranty_end' => $this->warranty_end?->format('Y-m-d'),
            'is_under_warranty' => $this->isUnderWarranty(),
            'specifications' => $this->specifications,
            'notes' => $this->notes,
            'attachments' => $this->whenLoaded('attachments', fn() => 
                $this->attachments->map(fn($att) => [
                    'id' => $att->id,
                    'filename' => $att->filename,
                    'original_name' => $att->original_name,
                    'type' => $att->type,
                    'size' => $att->human_size,
                    'url' => $att->url,
                ])
            ),
            'qr_data' => $this->qr_data,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
