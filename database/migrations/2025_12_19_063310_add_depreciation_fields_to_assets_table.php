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
        Schema::table('assets', function (Blueprint $table) {
            $table->integer('useful_life_years')->nullable()->after('purchase_price')->comment('Useful life in years');
            $table->decimal('residual_value', 15, 2)->default(0)->after('useful_life_years')->comment('Value at end of useful life');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->dropColumn(['useful_life_years', 'residual_value']);
        });
    }
};
