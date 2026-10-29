<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Rappel;
use Carbon\Carbon;

class EnvoyerRappels extends Command
{
    protected $signature = 'rappels:envoyer';
    protected $description = 'Envoyer les rappels planifiés dont la date est dépassée (simulation SMS/Email)';

    public function handle(): void
    {
        $rappels = Rappel::with('patient')
            ->where('statut', 'en_attente')
            ->where('date_planifiee', '<=', Carbon::now())
            ->get();

        if ($rappels->isEmpty()) {
            $this->info('Aucun rappel à envoyer.');
            return;
        }

        foreach ($rappels as $rappel) {
            // Simulation envoi SMS/Email
            $this->line("📱 Rappel → {$rappel->patient->prenom} {$rappel->patient->nom} | {$rappel->type_rappel} | {$rappel->message}");

            $rappel->update(['statut' => 'envoye']);
        }

        $this->info("✅ {$rappels->count()} rappel(s) envoyés.");
    }
}
