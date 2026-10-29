<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Une consultation peut être créée directement à partir d'un patient,
     * sans rendez-vous préalable. On rend donc rendez_vous_id nullable.
     */
    public function up(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            $table->foreignId('rendez_vous_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            $table->foreignId('rendez_vous_id')->nullable(false)->change();
        });
    }
};
