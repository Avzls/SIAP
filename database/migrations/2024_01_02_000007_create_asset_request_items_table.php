<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Flexible request items table.
     * 
     * For NEW requests: specify category_id + quantity + specifications
     * For RETURN/REPAIR/TRANSFER: specify asset_id
     * For TRANSFER: also specify transfer_to_user_id
     */
    public function up(): void
    {
        Schema::create('asset_request_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('request_id')->constrained('asset_requests')->cascadeOnDelete();

            // For NEW requests - specify category wanted
            $table->foreignId('category_id')->nullable()->constrained('asset_categories');
            $table->unsignedInteger('quantity')->default(1);
            $table->text('specifications')->nullable();     // Requested specs

            // For RETURN/REPAIR/TRANSFER - existing asset
            $table->foreignId('asset_id')->nullable()->constrained('assets');

            // For TRANSFER - target user
            $table->foreignId('transfer_to_user_id')->nullable()->constrained('users');

            // Fulfillment: which asset was actually assigned
            $table->foreignId('fulfilled_asset_id')->nullable()->constrained('assets');

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('request_id');
            $table->index('asset_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('asset_request_items');
    }
};
