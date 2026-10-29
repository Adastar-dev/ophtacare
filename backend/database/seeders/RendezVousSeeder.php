<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\RendezVous;
use App\Models\Patient;
use App\Models\User;
use Carbon\Carbon;

class RendezVousSeeder extends Seeder
{
    public function run(): void
    {
        $medecin = User::where('role', 'medecin')->first();
        $patients = Patient::all();

        if (!$medecin || $patients->isEmpty()) {
            return;
        }

        $statuts = ['confirme', 'confirme', 'honore', 'honore', 'en_attente_paiement'];
        $statutsPaiement = ['solde', 'acompte_verse', 'solde', 'non_paye', 'non_paye'];
        $motifs = [
            'Bilan visuel annuel',
            'Contrôle myopie',
            'Gêne visuelle / Flou',
            'Consultation presbytie',
            'Suivi post-opératoire',
            'Contrôle tension oculaire',
        ];

        foreach ($patients->take(6) as $i => $patient) {
            RendezVous::create([
                'patient_id' => $patient->id,
                'user_id' => $medecin->id,
                'clinique_id' => 1,
                'date_heure_rdv' => Carbon::now()->addDays(($i - 2) * 3)->setHour(9 + $i)->setMinute(0),
                'statut_rdv' => $statuts[$i % count($statuts)],
                'statut_paiement' => $statutsPaiement[$i % count($statutsPaiement)],
                'montant_total' => 15000.00,
                'motif' => $motifs[$i % count($motifs)],
            ]);
        }
    }
}
