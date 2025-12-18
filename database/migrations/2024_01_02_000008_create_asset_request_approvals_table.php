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
        Schema::create('asset_request_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('request_id')->constrained('asset_requests')->cascadeOnDelete();
            $table->foreignId('approver_id')->constrained('users');
            $table->unsignedTinyInteger('sequence')->default(1);  // Multi-level future

            $table->enum('status', ['PENDING', 'APPROVED', 'REJECTED'])->default('PENDING');
            $table->text('remarks')->nullable();

            // Audit fields - MANDATORY for all decisions
            $table->foreignId('decided_by')->nullable()->constrained('users');
            $table->timestamp('decided_at')->nullable();

            $table->timestamps();

            // Constraints
            $table->unique(['request_id', 'approver_id', 'sequence']);
            $table->index(['approver_id', 'status']);
            $table->index(['status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('asset_request_approvals');
    }
};
