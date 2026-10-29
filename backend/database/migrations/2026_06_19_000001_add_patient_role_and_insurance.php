<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Ajoute le rôle "patient" (compte client en self-service), le lien
     * users -> patients, les informations d'assurance du patient et la prise
     * en charge assurance sur le rendez-vous (alternative à l'acompte 50%).
     */
    public function up(): void
    {
        // 1. Rôle patient + lien vers la fiche patient
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin','admin_entite','medecin','secretaire','caissier','patient') NOT NULL");

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('patient_id')->nullable()->after('clinique_id')
                ->constrained('patients')->onDelete('set null');
        });

        // 2. Informations d'assurance sur la fiche patient
        Schema::table('patients', function (Blueprint $table) {
            $table->string('assureur')->nullable()->after('allergies');
            $table->string('numero_assurance')->nullable()->after('assureur');
            $table->unsignedTinyInteger('taux_couverture')->nullable()->after('numero_assurance'); // 0-100 %
        });

        // 3. Prise en charge assurance sur le rendez-vous
        Schema::table('rendez_vous', function (Blueprint $table) {
            $table->boolean('prise_en_charge_assurance')->default(false)->after('statut_paiement');
        });

        // Nouveau statut de paiement : pris_en_charge (validé par l'assurance, sans acompte)
        DB::statement("ALTER TABLE rendez_vous MODIFY COLUMN statut_paiement ENUM('non_paye','acompte_verse','solde','pris_en_charge') NOT NULL DEFAULT 'non_paye'");
    }

    public function down(): void
    {
        Schema::table('rendez_vous', function (Blueprint $table) {
            $table->dropColumn('prise_en_charge_assurance');
        });
        DB::statement("ALTER TABLE rendez_vous MODIFY COLUMN statut_paiement ENUM('non_paye','acompte_verse','solde') NOT NULL DEFAULT 'non_paye'");

        Schema::table('patients', function (Blueprint $table) {
            $table->dropColumn(['assureur', 'numero_assurance', 'taux_couverture']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('patient_id');
        });
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin','admin_entite','medecin','secretaire','caissier') NOT NULL");
    }
};
