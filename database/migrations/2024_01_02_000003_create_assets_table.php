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
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->string('asset_tag', 50)->unique();      // QR encodes this ONLY
            $table->string('name');
            $table->foreignId('category_id')->constrained('asset_categories');

            // Current state (denormalized for fast queries)
            $table->enum('status', [
                'IN_STOCK',
                'ASSIGNED',
                'IN_REPAIR',
                'LOST',
                'RETIRED',
                'DISPOSED'
            ])->default('IN_STOCK');
            $table->foreignId('current_user_id')->nullable()->constrained('users');
            $table->foreignId('current_location_id')->nullable()->constrained('asset_locations');

            // Asset details
            $table->string('brand')->nullable();
            $table->string('model')->nullable();
            $table->string('serial_number')->nullable();
            $table->date('purchase_date')->nullable();
            $table->decimal('purchase_price', 15, 2)->nullable();
            $table->date('warranty_end')->nullable();
            $table->json('specifications')->nullable();     // Flexible specs
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Indexes for common queries
            $table->index('status');
            $table->index('current_user_id');
            $table->index('current_location_id');
            $table->index('serial_number');
            $table->index(['category_id', 'status']);
            $table->index(['status', 'current_location_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
