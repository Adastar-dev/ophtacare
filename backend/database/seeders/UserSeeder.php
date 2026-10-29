<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Le Super Administrateur (Généraliste - Gère toute la plateforme, pas rattaché à une clinique)
        User::create([
            'name' => 'Mouhammad Ndiaye',
            'email' => 'superadmin@ophtalmo.sn',
            'password' => Hash::make('password'),
            'role' => 'super_admin',
            'clinique_id' => null,
            'is_active' => true,
        ]);

        // 2. Administrateur d'entité (Gère la clinique de Dakar)
        User::create([
            'name' => 'Amadou Diallo',
            'email' => 'admin.dakar@ophtalmo.sn',
            'password' => Hash::make('password'),
            'role' => 'admin_entite',
            'clinique_id' => 1,
            'is_active' => true,
        ]);

        // 3. Un Médecin Ophtalmologue (Rattaché à Dakar)
        User::create([
            'name' => 'Dr. Fatou Sow',
            'email' => 'dr.sow@ophtalmo.sn',
            'password' => Hash::make('password'),
            'role' => 'medecin',
            'clinique_id' => 1,
            'is_active' => true,
        ]);

        // 4. Une Secrétaire (Rattachée à Dakar)
        User::create([
            'name' => 'Aicha Diop',
            'email' => 'secretaire.dakar@ophtalmo.sn',
            'password' => Hash::make('password'),
            'role' => 'secretaire',
            'clinique_id' => 1,
            'is_active' => true,
        ]);

        // 5. Un Caissier (Rattaché à Dakar - Pour la gestion Wave/OM/Liquide)
        User::create([
            'name' => 'Ibrahima Ba',
            'email' => 'caisse.dakar@ophtalmo.sn',
            'password' => Hash::make('password'),
            'role' => 'caissier',
            'clinique_id' => 1,
            'is_active' => true,
        ]);
    }
}