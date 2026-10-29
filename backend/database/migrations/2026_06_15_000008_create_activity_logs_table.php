<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('action'); // ex: patient.created, consultation.updated
            $table->string('model_type')->nullable(); // App\Models\Patient
            $table->unsignedBigInteger('model_id')->nullable();
            $table->json('anciennes_valeurs')->nullable(); // Avant modification
            $table->json('nouvelles_valeurs')->nullable(); // Après modification
            $table->string('ip')->nullable();
            $table->string('user_agent')->nullable();
            $table->foreignId('clinique_id')->nullable()->constrained('cliniques')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
