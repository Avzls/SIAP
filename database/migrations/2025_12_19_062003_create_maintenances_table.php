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
        Schema::create('maintenances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('assets')->onDelete('cascade');
            $table->foreignId('schedule_id')->nullable()->constrained('maintenance_schedules')->nullOnDelete();
            $table->string('type')->default('PREVENTIVE'); // PREVENTIVE, CORRECTIVE
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('cost', 15, 2)->default(0);
            $table->string('status')->default('COMPLETED'); // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
            $table->string('performed_by')->nullable(); // Technician name or vendor
            $table->dateTime('completed_at')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('maintenances');
    }
};
