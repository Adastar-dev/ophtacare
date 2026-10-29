<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Patient;

class PatientSeeder extends Seeder
{
    public function run(): void
    {
        $patients = [
            ['nom' => 'Diallo', 'prenom' => 'Mariama', 'date_naissance' => '1985-03-12', 'genre' => 'F', 'telephone' => '771234001', 'email' => 'mariama.diallo@gmail.com'],
            ['nom' => 'Ndiaye', 'prenom' => 'Ousmane', 'date_naissance' => '1978-07-22', 'genre' => 'M', 'telephone' => '771234002', 'email' => 'ousmane.ndiaye@gmail.com'],
            ['nom' => 'Sow', 'prenom' => 'Aissatou', 'date_naissance' => '1992-11-05', 'genre' => 'F', 'telephone' => '771234003', 'email' => null],
            ['nom' => 'Ba', 'prenom' => 'Mamadou', 'date_naissance' => '1965-01-30', 'genre' => 'M', 'telephone' => '771234004', 'email' => 'mamadou.ba@outlook.com'],
            ['nom' => 'Fall', 'prenom' => 'Rokhaya', 'date_naissance' => '2001-09-18', 'genre' => 'F', 'telephone' => '771234005', 'email' => null],
            ['nom' => 'Gueye', 'prenom' => 'Pape', 'date_naissance' => '1970-04-14', 'genre' => 'M', 'telephone' => '771234006', 'email' => 'pape.gueye@gmail.com'],
            ['nom' => 'Toure', 'prenom' => 'Aminata', 'date_naissance' => '1988-06-25', 'genre' => 'F', 'telephone' => '771234007', 'email' => null],
            ['nom' => 'Mbaye', 'prenom' => 'Serigne', 'date_naissance' => '1955-12-10', 'genre' => 'M', 'telephone' => '771234008', 'email' => 'serigne.mbaye@hotmail.com'],
        ];

        foreach ($patients as $index => $data) {
            $numero = str_pad($index + 1, 4, '0', STR_PAD_LEFT);
            Patient::create(array_merge($data, [
                'code_patient' => 'PAT-2026-' . $numero,
                'antecedents_medicaux' => $index % 2 === 0 ? 'Diabète de type 2' : null,
                'allergies' => $index % 3 === 0 ? 'Pénicilline' : null,
                'clinique_id' => 1,
            ]));
        }
    }
}
