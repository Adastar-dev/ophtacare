<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Clinique;

class CliniqueSeeder extends Seeder
{
    public function run(): void
    {
        Clinique::create([
            'id' => 1,
            'nom' => 'Centre Ophtalmologique de Dakar (ESMT-Vision)',
            'adresse' => 'Avenue Cheikh Anta Diop, Dakar',
            'telephone' => '+221338690000',
            'statut' => 'actif',
        ]);

        Clinique::create([
            'id' => 2,
            'nom' => 'Clinique de la Réfraction - Saint-Louis',
            'adresse' => 'Quartier Sor, Saint-Louis',
            'telephone' => '+221339610000',
            'statut' => 'actif',
        ]);
    }
}