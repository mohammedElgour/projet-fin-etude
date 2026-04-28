<?php

namespace Database\Seeders;

use App\Models\Filier;
use Illuminate\Database\Seeder;

class FilierSeeder extends Seeder
{
    public function run(): void
    {
        $filieres = [
            [
                'nom' => 'Developpement Digital',
                'description' => 'Formation orientee web, mobile et backend.',
            ],
            [
                'nom' => 'Infrastructure Digitale',
                'description' => 'Formation reseaux, systemes et support.',
            ],
        ];

        foreach ($filieres as $filiere) {
            Filier::updateOrCreate(['nom' => $filiere['nom']], $filiere);
        }
    }
}
