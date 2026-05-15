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
                'nom' => "D\u{00E9}veloppement Digital",
                'description' => 'Formation orientee web, mobile et backend.',
            ],
            [
                'nom' => 'Infrastructure Digitale',
                'description' => 'Formation reseaux, systemes et support.',
            ],
            [
                'nom' => 'Gestion des Entreprises',
                'description' => 'Formation orientee gestion et administration des entreprises.',
            ],
            [
                'nom' => "G\u{00E9}nie Electrique",
                'description' => 'Formation orientee installations electriques et maintenance.',
            ],
            [
                'nom' => 'Digital Design',
                'description' => 'Formation orientee design numerique et creation visuelle.',
            ],
            [
                'nom' => 'Techniques Habillement Industrialisation',
                'description' => 'Formation orientee production et industrialisation de l habillement.',
            ],
            [
                'nom' => "G\u{00E9}nie Civil",
                'description' => 'Formation orientee construction, chantier et etudes techniques.',
            ],
        ];

        $existing = Filier::query()->get()->keyBy('id');

        foreach ($filieres as $filiere) {
            $match = $existing->first(fn (Filier $item) => $item->nom === $filiere['nom']);

            if ($match) {
                $match->update($filiere);
                continue;
            }

            $created = Filier::create($filiere);
            $existing->put($created->id, $created);
        }
    }
}
