<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transaction_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paiement_id')->nullable()->constrained('paiements')->onDelete('set null');
            $table->foreignId('rendez_vous_id')->nullable()->constrained('rendez_vous')->onDelete('set null');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null'); // Caissier
            $table->string('reference')->unique(); // REF-YYYYMMDD-XXXXX
            $table->enum('type_evenement', [
                'initiation_paiement',
                'callback_recu',
                'paiement_valide',
                'paiement_echoue',
                'remboursement_initie',
                'remboursement_valide',
                'expiration_lien',
            ]);
            $table->enum('operateur', ['liquide', 'wave', 'orange_money', 'system'])->default('system');
            $table->decimal('montant', 10, 2)->nullable();
            $table->string('devise')->default('XOF');
            $table->json('payload_entrant')->nullable(); // Données reçues de l'opérateur
            $table->json('payload_sortant')->nullable(); // Données envoyées à l'opérateur
            $table->string('http_status_code')->nullable();
            $table->text('message')->nullable();
            $table->string('ip_source')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transaction_logs');
    }
};
