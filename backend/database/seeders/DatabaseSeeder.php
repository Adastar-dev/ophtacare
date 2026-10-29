<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // On appelle d'abord les cliniques, puis les utilisateurs (à cause de la clé étrangère)
        $this->call([
            CliniqueSeeder::class,
            UserSeeder::class,
            PatientSeeder::class,
            RendezVousSeeder::class,
        ]);
    }
}