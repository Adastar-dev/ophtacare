<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Plages d'indisponibilité (hors service) d'un médecin.
     * Partagées : visibles dans tous les calendriers de la clinique
     * (médecin, secrétaire, patient) pour griser les créneaux concernés.
     */
    public function up(): void
    {
        Schema::create('indisponibilites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // le médecin
            $table->foreignId('clinique_id')->constrained('cliniques')->onDelete('cascade');
            $table->date('date');
            $table->unsignedTinyInteger('heure_debut')->default(8); // heure pleine 0-23
            $table->unsignedTinyInteger('heure_fin')->default(18);   // exclusif
            $table->string('motif')->nullable();
            $table->timestamps();

            $table->index(['clinique_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('indisponibilites');
    }
};
