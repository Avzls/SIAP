<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\AssetAttachment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AssetAttachmentController extends Controller
{
    /**
     * List attachments for an asset
     */
    public function index(Asset $asset): JsonResponse
    {
        $attachments = $asset->attachments()
            ->with('uploader:id,name')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($att) => [
                'id' => $att->id,
                'original_name' => $att->original_name,
                'mime_type' => $att->mime_type,
                'size' => $att->size,
                'human_size' => $att->human_size,
                'type' => $att->type,
                'url' => $att->url,
                'is_image' => $att->isImage(),
                'uploaded_by' => $att->uploader?->name,
                'created_at' => $att->created_at,
            ]);

        return response()->json([
            'data' => $attachments,
        ]);
    }

    /**
     * Upload attachment
     */
    public function store(Request $request, Asset $asset): JsonResponse
    {
        $this->authorize('update', $asset);

        $request->validate([
            'file' => 'required|file|max:10240', // 10MB max
            'type' => 'nullable|in:photo,document,invoice,warranty,other',
        ]);

        $file = $request->file('file');
        $type = $request->input('type', 'other');
        
        // Generate unique filename
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = "assets/{$asset->id}/{$filename}";
        
        // Store file
        Storage::disk('public')->put($path, file_get_contents($file));

        // Create attachment record
        $attachment = AssetAttachment::create([
            'asset_id' => $asset->id,
            'filename' => $filename,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'disk' => 'public',
            'path' => $path,
            'type' => $type,
            'uploaded_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'File berhasil diupload',
            'data' => [
                'id' => $attachment->id,
                'original_name' => $attachment->original_name,
                'mime_type' => $attachment->mime_type,
                'size' => $attachment->size,
                'human_size' => $attachment->human_size,
                'type' => $attachment->type,
                'url' => $attachment->url,
                'is_image' => $attachment->isImage(),
            ],
        ], 201);
    }

    /**
     * Delete attachment
     */
    public function destroy(Asset $asset, AssetAttachment $attachment): JsonResponse
    {
        $this->authorize('update', $asset);

        // Make sure attachment belongs to this asset
        if ($attachment->asset_id !== $asset->id) {
            return response()->json(['message' => 'Attachment not found'], 404);
        }

        // Delete file from storage
        Storage::disk($attachment->disk)->delete($attachment->path);

        // Delete record
        $attachment->delete();

        return response()->json([
            'message' => 'File berhasil dihapus',
        ]);
    }
}
