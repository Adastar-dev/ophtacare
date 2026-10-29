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
    Schema::create('paiements', function (Blueprint $table) {
        $table->id();
        $table->foreignId('rendez_vous_id')->constrained('rendez_vous')->onDelete('cascade');
        $table->foreignId('user_id')->nullable()->constrained('users'); // Le caissier qui a validé (si physique)
        $table->decimal('montant', 10, 2);
        $table->enum('type_paiement', ['acompte', 'solde', 'total']); 
        $table->enum('mode_paiement', ['liquide', 'wave', 'orange_money']); 
        $table->string('transaction_id')->nullable()->unique(); // ID renvoyé par l'API Wave/OM
        $table->string('reference_operateur')->nullable(); // Ref interne opérateur Wave/OM
        $table->enum('statut', ['en_attente', 'reussi', 'echoue', 'rembourse'])->default('en_attente');
        $table->string('devise')->default('XOF');
        $table->json('metadata')->nullable(); // Payload brut callback opérateur
        $table->timestamp('expire_at')->nullable(); // Expiration lien paiement mobile
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('paiements');
    }
};
