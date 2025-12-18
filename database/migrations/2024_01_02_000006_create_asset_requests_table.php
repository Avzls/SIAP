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
        Schema::create('asset_requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_number', 20)->unique(); // REQ-2024-000001
            $table->foreignId('requester_id')->constrained('users');

            $table->enum('request_type', [
                'NEW',          // Request new asset
                'RETURN',       // Return asset
                'REPAIR',       // Request repair
                'TRANSFER',     // Transfer to another user
            ]);

            $table->enum('status', [
                'DRAFT',
                'SUBMITTED',
                'PENDING_APPROVAL',
                'APPROVED',
                'REJECTED',
                'PENDING_FULFILLMENT',
                'FULFILLED',
                'CLOSED',
                'CANCELLED',
            ])->default('DRAFT');

            $table->text('justification')->nullable();
            $table->text('rejection_reason')->nullable();

            // Fulfillment tracking
            $table->foreignId('fulfilled_by')->nullable()->constrained('users');
            $table->timestamp('fulfilled_at')->nullable();
            $table->text('fulfillment_notes')->nullable();

            $table->timestamps();

            // Indexes
            $table->index('status');
            $table->index(['requester_id', 'status']);
            $table->index(['status', 'created_at']);
        });

        // Add foreign key to asset_movements now that asset_requests exists
        Schema::table('asset_movements', function (Blueprint $table) {
            $table->foreign('request_id')->references('id')->on('asset_requests');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('asset_movements', function (Blueprint $table) {
            $table->dropForeign(['request_id']);
        });
        
        Schema::dropIfExists('asset_requests');
    }
};
