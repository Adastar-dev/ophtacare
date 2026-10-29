<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Détaille la facturation d'un rendez-vous :
     *  - montant_total      : prix initial de la prestation
     *  - prise en charge    : option justifiée (taux % + document à l'appui)
     *  - montant_assurance  : part couverte par l'assurance (= total * taux/100)
     *  - montant_patient    : reste à la charge du patient (= total - assurance)
     *  - montant_acompte    : montant minimum exigé pour valider le RDV
     *        · sans prise en charge -> 50% du total
     *        · avec prise en charge -> 100% du reste patient (le reste doit être payé)
     *  - document_prise_en_charge : justificatif uploadé
     */
    public function up(): void
    {
        Schema::table('rendez_vous', function (Blueprint $table) {
            if (!Schema::hasColumn('rendez_vous', 'taux_prise_en_charge')) {
                $table->unsignedTinyInteger('taux_prise_en_charge')->nullable()->after('prise_en_charge_assurance');
            }
            if (!Schema::hasColumn('rendez_vous', 'montant_assurance')) {
                $table->decimal('montant_assurance', 10, 2)->default(0)->after('montant_total');
            }
            if (!Schema::hasColumn('rendez_vous', 'montant_patient')) {
                $table->decimal('montant_patient', 10, 2)->default(0)->after('montant_assurance');
            }
            if (!Schema::hasColumn('rendez_vous', 'montant_acompte')) {
                $table->decimal('montant_acompte', 10, 2)->default(0)->after('montant_patient');
            }
            if (!Schema::hasColumn('rendez_vous', 'document_prise_en_charge')) {
                $table->string('document_prise_en_charge')->nullable()->after('motif');
            }
        });
    }

    public function down(): void
    {
        Schema::table('rendez_vous', function (Blueprint $table) {
            $table->dropColumn([
                'taux_prise_en_charge',
                'montant_assurance',
                'montant_patient',
                'montant_acompte',
                'document_prise_en_charge',
            ]);
        });
    }
};
