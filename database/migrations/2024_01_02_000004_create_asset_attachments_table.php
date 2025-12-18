<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('asset_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->string('filename');
            $table->string('original_name');
            $table->string('mime_type', 50);
            $table->unsignedInteger('size');                // bytes
            $table->string('disk', 20)->default('local');   // local, minio, s3
            $table->string('path');
            $table->enum('type', ['photo', 'document', 'invoice', 'warranty', 'other'])
                  ->default('other');
            $table->foreignId('uploaded_by')->constrained('users');
            $table->timestamps();

            $table->index(['asset_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('asset_attachments');
    }
};
