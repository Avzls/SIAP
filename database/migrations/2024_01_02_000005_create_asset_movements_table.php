<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * APPEND-ONLY TABLE - Source of truth for audit
     * 
     * This table should NEVER have UPDATE or DELETE operations.
     * All state changes are recorded as new rows.
     */
    public function up(): void
    {
        Schema::create('asset_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('assets');

            $table->enum('movement_type', [
                'CREATE',       // Asset created
                'ASSIGN',       // Assigned to user
                'RETURN',       // Returned to stock
                'TRANSFER',     // Transfer between users/locations
                'REPAIR_OUT',   // Sent for repair
                'REPAIR_IN',    // Returned from repair
                'LOST',         // Marked as lost
                'FOUND',        // Found after lost
                'RETIRE',       // Retired from service
                'DISPOSE',      // Disposed/sold
                'UPDATE',       // Metadata update
            ]);

            // State transition
            $table->string('from_status', 20)->nullable();
            $table->string('to_status', 20);

            // User transition
            $table->foreignId('from_user_id')->nullable()->constrained('users');
            $table->foreignId('to_user_id')->nullable()->constrained('users');

            // Location transition
            $table->foreignId('from_location_id')->nullable()->constrained('asset_locations');
            $table->foreignId('to_location_id')->nullable()->constrained('asset_locations');

            // Context
            $table->foreignId('performed_by')->constrained('users');
            $table->foreignId('request_id')->nullable();  // Will be constrained after requests table
            $table->text('notes')->nullable();
            $table->json('metadata')->nullable();           // Additional context

            $table->timestamp('created_at');
            // NO updated_at - APPEND ONLY, NO UPDATES ALLOWED

            // Indexes for audit queries
            $table->index(['asset_id', 'created_at']);
            $table->index('movement_type');
            $table->index('performed_by');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('asset_movements');
    }
};
