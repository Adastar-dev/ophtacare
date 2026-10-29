<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Aligne le schéma sur les modèles Eloquent.
 *
 * - prescriptions : le détail de l'ordonnance est stocké dans une colonne JSON
 *   `contenu_ordonnance` (modèle Prescription), et non plus en colonnes séparées.
 * - transaction_logs : noms de colonnes utilisés par TransactionLog
 *   (payload_requete, payload_reponse, http_status, ip).
 *
 * Idempotente : sans effet sur une base déjà alignée (import de ophtalmo_db.sql).
 */
return new class extends Migration
{
    private array $anciennesColonnes = ['type_verre', 'type_teinte', 'oeil_droit_add', 'oeil_gauche_add', 'remarques'];

    private array $renommages = [
        'payload_entrant' => 'payload_requete',
        'payload_sortant' => 'payload_reponse',
        'http_status_code' => 'http_status',
        'ip_source' => 'ip',
    ];

    public function up(): void
    {
        if (! Schema::hasColumn('prescriptions', 'contenu_ordonnance')) {
            Schema::table('prescriptions', function (Blueprint $table) {
                $table->json('contenu_ordonnance')->nullable()->after('consultation_id');
            });

            DB::table('prescriptions')->orderBy('id')->each(function ($p) {
                DB::table('prescriptions')->where('id', $p->id)->update([
                    'contenu_ordonnance' => json_encode([
                        'type_verre' => $p->type_verre,
                        'type_teinte' => $p->type_teinte,
                        'oeil_droit_add' => $p->oeil_droit_add,
                        'oeil_gauche_add' => $p->oeil_gauche_add,
                        'remarques' => $p->remarques,
                    ]),
                ]);
            });

            Schema::table('prescriptions', function (Blueprint $table) {
                $table->dropColumn($this->anciennesColonnes);
            });
        }

        foreach ($this->renommages as $ancien => $nouveau) {
            if (Schema::hasColumn('transaction_logs', $ancien) && ! Schema::hasColumn('transaction_logs', $nouveau)) {
                Schema::table('transaction_logs', function (Blueprint $table) use ($ancien, $nouveau) {
                    $table->renameColumn($ancien, $nouveau);
                });
            }
        }
    }

    public function down(): void
    {
        foreach ($this->renommages as $ancien => $nouveau) {
            if (Schema::hasColumn('transaction_logs', $nouveau) && ! Schema::hasColumn('transaction_logs', $ancien)) {
                Schema::table('transaction_logs', function (Blueprint $table) use ($ancien, $nouveau) {
                    $table->renameColumn($nouveau, $ancien);
                });
            }
        }

        if (Schema::hasColumn('prescriptions', 'contenu_ordonnance')) {
            Schema::table('prescriptions', function (Blueprint $table) {
                $table->string('type_verre')->default('unifocal');
                $table->string('type_teinte')->default('blanc');
                $table->string('oeil_droit_add')->default('0.00');
                $table->string('oeil_gauche_add')->default('0.00');
                $table->text('remarques')->nullable();
            });

            DB::table('prescriptions')->orderBy('id')->each(function ($p) {
                $c = json_decode($p->contenu_ordonnance ?? '{}', true) ?: [];
                DB::table('prescriptions')->where('id', $p->id)->update([
                    'type_verre' => $c['type_verre'] ?? 'unifocal',
                    'type_teinte' => $c['type_teinte'] ?? 'blanc',
                    'oeil_droit_add' => $c['oeil_droit_add'] ?? '0.00',
                    'oeil_gauche_add' => $c['oeil_gauche_add'] ?? '0.00',
                    'remarques' => $c['remarques'] ?? null,
                ]);
            });

            Schema::table('prescriptions', function (Blueprint $table) {
                $table->dropColumn('contenu_ordonnance');
            });
        }
    }
};
