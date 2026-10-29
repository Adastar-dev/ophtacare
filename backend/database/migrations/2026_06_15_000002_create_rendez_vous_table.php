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
    Schema::create('rendez_vous', function (Blueprint $table) {
        $table->id();
        $table->foreignId('patient_id')->constrained('patients')->onDelete('cascade');
        $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null'); // Le médecin ciblé (optionnel)
        $table->foreignId('clinique_id')->constrained('cliniques')->onDelete('cascade');
        $table->dateTime('date_heure_rdv');
        $table->enum('statut_rdv', ['en_attente_paiement', 'confirme', 'annule', 'honore', 'expire'])->default('en_attente_paiement');
        $table->enum('statut_paiement', ['non_paye', 'acompte_verse', 'solde'])->default('non_paye'); // Règle de l'acompte 50%
        $table->decimal('montant_total', 10, 2)->default(0.00); // Prix de la consultation de base
        $table->text('motif')->nullable();
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rendez_vouses');
    }
};
