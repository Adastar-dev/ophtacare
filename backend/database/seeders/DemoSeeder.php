<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\Consultation;
use App\Models\Indisponibilite;
use App\Models\Paiement;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\RendezVous;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Jeu de données de démonstration (fictif) : une journée de cabinet réaliste
 * autour de la date du jour. À lancer après DatabaseSeeder :
 *
 *   php artisan db:seed --class=DemoSeeder
 */
class DemoSeeder extends Seeder
{
    public function run(): void
    {
        mt_srand(2026);
        $today = Carbon::today();
        $sow = User::where('email', 'dr.sow@ophtalmo.sn')->firstOrFail();
        $caisse = User::where('email', 'caisse.dakar@ophtalmo.sn')->firstOrFail();
        $secretaire = User::where('email', 'secretaire.dakar@ophtalmo.sn')->firstOrFail();
        $admin = User::where('email', 'admin.dakar@ophtalmo.sn')->firstOrFail();

        $kane = User::firstOrCreate(['email' => 'dr.kane@ophtalmo.sn'], [
            'name' => 'Dr. Ibrahima Kane',
            'password' => Hash::make('password'),
            'role' => 'medecin',
            'clinique_id' => 1,
            'is_active' => true,
        ]);
        User::firstOrCreate(['email' => 'dr.faye@ophtalmo.sn'], [
            'name' => 'Dr. Khady Faye',
            'password' => Hash::make('password'),
            'role' => 'medecin',
            'clinique_id' => 2,
            'is_active' => true,
        ]);

        $nouveaux = [
            ['Camara', 'Fatoumata', '1990-02-14', 'F'], ['Diop', 'Cheikh', '1983-08-03', 'M'],
            ['Sarr', 'Ndeye', '1997-05-21', 'F'], ['Cisse', 'Moussa', '1961-10-09', 'M'],
            ['Kane', 'Awa', '2004-01-27', 'F'], ['Thiam', 'Babacar', '1975-03-16', 'M'],
            ['Faye', 'Coumba', '1969-12-02', 'F'], ['Seck', 'Alioune', '1958-07-30', 'M'],
            ['Niang', 'Marieme', '1994-09-11', 'F'], ['Lo', 'Abdoulaye', '1980-11-19', 'M'],
        ];
        $n = Patient::count();
        foreach ($nouveaux as $i => [$nom, $prenom, $naissance, $genre]) {
            $n++;
            Patient::create([
                'code_patient' => 'PAT-2026-' . str_pad($n, 4, '0', STR_PAD_LEFT),
                'nom' => $nom,
                'prenom' => $prenom,
                'date_naissance' => $naissance,
                'genre' => $genre,
                'telephone' => '77' . (5550100 + $i),
                'email' => null,
                'assureur' => $i % 3 === 0 ? 'IPM Sonatel' : ($i % 4 === 1 ? 'AXA Sénégal' : null),
                'numero_assurance' => $i % 3 === 0 || $i % 4 === 1 ? 'ASS-' . (40210 + $i) : null,
                'taux_couverture' => $i % 3 === 0 ? 80 : ($i % 4 === 1 ? 70 : null),
                'clinique_id' => 1,
            ]);
        }

        // Compte patient en self-service, lié à une fiche existante
        $mariama = Patient::where('nom', 'Diallo')->where('prenom', 'Mariama')->first();
        if ($mariama) {
            User::firstOrCreate(['email' => 'patient.demo@ophtalmo.sn'], [
                'name' => 'Mariama Diallo',
                'password' => Hash::make('password'),
                'role' => 'patient',
                'clinique_id' => 1,
                'patient_id' => $mariama->id,
                'is_active' => true,
            ]);
        }

        $patients = Patient::where('clinique_id', 1)->get();
        $motifs = ['Baisse de vision de loin', 'Contrôle tension oculaire', 'Renouvellement de lunettes', 'Fond d\'œil', 'Myopie — suivi annuel',
            'Rougeur et démangeaisons', 'Presbytie', 'Bilan avant chirurgie de la cataracte', 'Sécheresse oculaire', 'Première consultation'];
        $diagnostics = [
            ['Myopie légère avec astigmatisme', 'Fond d\'œil normal. Tonus 14/15 mmHg.', '-1.25', '-0.50', '180', '-1.50', '-0.75', '170', 'unifocal', 'blanc', '0.00'],
            ['Presbytie débutante', 'Addition de près conseillée. Pas d\'anomalie du segment antérieur.', '+1.00', '0.00', '0', '+1.25', '-0.25', '90', 'progressif', 'photochromique', '+1.50'],
            ['Hypermétropie', 'Vision de près gênée en fin de journée.', '+2.00', '-0.25', '95', '+1.75', '0.00', '0', 'unifocal', 'blanc', '0.00'],
            ['Conjonctivite allergique', 'Collyre antihistaminique, contrôle dans 15 jours.', '0.00', '0.00', '0', '0.00', '0.00', '0', 'unifocal', 'solaire', '0.00'],
            ['Astigmatisme mixte', 'Kératométrie à refaire au prochain contrôle.', '+0.50', '-1.75', '15', '+0.25', '-1.50', '165', 'unifocal', 'blanc', '0.00'],
        ];

        $creer = function (Carbon $quand, User $medecin, Patient $p, string $statut, int $tarif, string $motif) use ($caisse, $diagnostics) {
            $assure = (bool) $p->taux_couverture;
            $partPatient = $assure ? round($tarif * (100 - $p->taux_couverture) / 100) : $tarif;
            $rdv = RendezVous::create([
                'patient_id' => $p->id,
                'user_id' => $medecin->id,
                'clinique_id' => 1,
                'date_heure_rdv' => $quand,
                'statut_rdv' => $statut,
                'statut_paiement' => 'non_paye',
                'prise_en_charge_assurance' => $assure,
                'taux_prise_en_charge' => $assure ? $p->taux_couverture : null,
                'montant_total' => $tarif,
                'montant_assurance' => $tarif - $partPatient,
                'montant_patient' => $partPatient,
                'montant_acompte' => $assure ? $partPatient : $partPatient / 2,
                'motif' => $motif,
            ]);
            $rdv->created_at = $quand->copy()->subDays(mt_rand(2, 9));
            $rdv->save();

            if ($statut === 'en_attente_paiement' || $statut === 'annule') {
                return $rdv;
            }

            $modes = ['liquide', 'wave', 'orange_money'];
            $payes = $statut === 'honore' ? [$partPatient] : ($assure ? [$partPatient] : [$partPatient / 2]);
            foreach ($payes as $montant) {
                $mode = $modes[mt_rand(0, 2)];
                $pay = Paiement::create([
                    'rendez_vous_id' => $rdv->id,
                    'user_id' => $caisse->id,
                    'montant' => $montant,
                    'type_paiement' => $montant >= $partPatient ? 'total' : 'acompte',
                    'mode_paiement' => $mode,
                    'transaction_id' => $mode === 'liquide' ? null : strtoupper($mode === 'wave' ? 'WAVE-' : 'OM-') . strtoupper(Str::random(10)),
                    'statut' => 'reussi',
                    'devise' => 'XOF',
                ]);
                $pay->created_at = min($quand->copy()->subHours(mt_rand(1, 40)), Carbon::now());
                $pay->save();
            }
            $rdv->update(['statut_paiement' => $statut === 'honore' || $assure ? ($assure ? 'pris_en_charge' : 'solde') : 'acompte_verse']);

            if ($statut === 'honore') {
                $d = $diagnostics[mt_rand(0, count($diagnostics) - 1)];
                $c = Consultation::create([
                    'rendez_vous_id' => $rdv->id,
                    'patient_id' => $p->id,
                    'user_id' => $rdv->user_id,
                    'vl_od_sans_correction' => (mt_rand(4, 8)) . '/10',
                    'vl_og_sans_correction' => (mt_rand(4, 8)) . '/10',
                    'vl_od_avec_correction' => '10/10',
                    'vl_og_avec_correction' => '10/10',
                    'ref_od_sphere' => $d[2], 'ref_od_cylindre' => $d[3], 'ref_od_axe' => $d[4],
                    'ref_og_sphere' => $d[5], 'ref_og_cylindre' => $d[6], 'ref_og_axe' => $d[7],
                    'tonus_od' => (string) mt_rand(12, 17), 'tonus_og' => (string) mt_rand(12, 17),
                    'diagnostic' => $d[0],
                    'observations_cliniques' => $d[1],
                ]);
                $c->created_at = $quand->copy()->addMinutes(25);
                $c->save();
                $pr = Prescription::create([
                    'consultation_id' => $c->id,
                    'contenu_ordonnance' => [
                        'type_verre' => $d[8], 'type_teinte' => $d[9],
                        'oeil_droit_add' => $d[10], 'oeil_gauche_add' => $d[10],
                        'remarques' => 'Port permanent recommandé. Contrôle dans un an.',
                    ],
                    'qr_token' => Str::random(40),
                    'qr_token_expire_at' => $quand->copy()->addDays(90),
                ]);
                $pr->created_at = $quand->copy()->addMinutes(30);
                $pr->save();
            }

            return $rdv;
        };

        // Les rendez-vous de démonstration remplacent ceux du seeder de base
        RendezVous::query()->delete();

        // Trois semaines passées : consultations honorées
        for ($j = 21; $j >= 1; $j--) {
            $jour = $today->copy()->subDays($j);
            if ($jour->isSunday()) {
                continue;
            }
            foreach ([9, 10, 11, 15, 16] as $k => $h) {
                if (mt_rand(0, 9) < 3) {
                    continue;
                }
                $medecin = $k % 2 === 0 ? $sow : $kane;
                $creer($jour->copy()->setTime($h, [0, 30][mt_rand(0, 1)]), $medecin, $patients->random(), 'honore', [15000, 15000, 25000][mt_rand(0, 2)], $motifs[mt_rand(0, 9)]);
            }
        }

        // Aujourd'hui : matinée honorée, après-midi confirmée ou en attente de paiement
        $journee = [
            [8, 30, 'honore'], [9, 15, 'honore'], [10, 0, 'honore'], [10, 45, 'honore'], [11, 30, 'honore'],
            [14, 30, 'confirme'], [15, 15, 'confirme'], [16, 0, 'en_attente_paiement'], [16, 45, 'confirme'], [17, 30, 'en_attente_paiement'],
        ];
        foreach ($journee as $i => [$h, $m, $statut]) {
            $creer($today->copy()->setTime($h, $m), $sow, $patients[$i % $patients->count()], $statut, $i % 4 === 0 ? 25000 : 15000, $motifs[$i % 10]);
        }
        foreach ([[9, 0], [11, 0], [15, 0]] as $i => [$h, $m]) {
            $creer($today->copy()->setTime($h, $m), $kane, $patients[($i + 11) % $patients->count()], $h < 12 ? 'honore' : 'confirme', 15000, $motifs[($i + 3) % 10]);
        }

        // Deux semaines à venir
        for ($j = 1; $j <= 14; $j++) {
            $jour = $today->copy()->addDays($j);
            if ($jour->isSunday()) {
                continue;
            }
            foreach ([9, 10, 11, 15, 16] as $k => $h) {
                if (mt_rand(0, 9) < 4) {
                    continue;
                }
                $creer($jour->copy()->setTime($h, 0), $k % 2 === 0 ? $sow : $kane, $patients->random(), mt_rand(0, 2) ? 'confirme' : 'en_attente_paiement', 15000, $motifs[mt_rand(0, 9)]);
            }
        }

        // Compte patient de démonstration : un rendez-vous à venir
        if ($mariama) {
            $creer($today->copy()->addDays(3)->setTime(10, 30), $sow, $mariama, 'confirme', 15000, 'Contrôle annuel');
        }

        // Plages hors service (bloc opératoire, congrès)
        $jeudi = $today->copy()->next(Carbon::THURSDAY);
        Indisponibilite::create(['user_id' => $sow->id, 'clinique_id' => 1, 'date' => $jeudi->toDateString(), 'heure_debut' => 14, 'heure_fin' => 18, 'motif' => 'Bloc opératoire']);
        Indisponibilite::create(['user_id' => $kane->id, 'clinique_id' => 1, 'date' => $today->copy()->addDays(9)->toDateString(), 'heure_debut' => 8, 'heure_fin' => 18, 'motif' => 'Congrès SFO']);

        // Journal d'activité
        $actions = [
            [$secretaire, 'creation_rendez_vous', 'RendezVous'], [$caisse, 'encaissement', 'Paiement'], [$sow, 'creation_consultation', 'Consultation'],
            [$sow, 'creation_prescription', 'Prescription'], [$admin, 'modification_utilisateur', 'User'], [$secretaire, 'creation_patient', 'Patient'],
        ];
        for ($i = 0; $i < 24; $i++) {
            [$u, $action, $type] = $actions[$i % count($actions)];
            $log = ActivityLog::create([
                'user_id' => $u->id,
                'action' => $action,
                'model_type' => 'App\\Models\\' . $type,
                'model_id' => mt_rand(1, 40),
                'ip' => '10.0.0.' . mt_rand(10, 60),
                'user_agent' => 'Mozilla/5.0',
                'clinique_id' => 1,
            ]);
            $log->created_at = Carbon::now()->subMinutes($i * 47 + mt_rand(0, 30));
            $log->save();
        }
    }
}
