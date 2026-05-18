<?php

namespace Database\Seeders;

use App\Models\Filier;
use App\Models\Professeur;
use App\Models\User;
use App\Support\FiliereNameNormalizer;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class ProfesseurSeeder extends Seeder
{
    public function run(): void
    {
        $professorUsers = User::query()
            ->where('role', 'professeur')
            ->get();

        $filieres = Filier::query()->get();

        foreach ($professorUsers as $user) {
            $filiere = match ($user->email) {
                'prof@ista.test' => $this->findFiliere($filieres, 'Développement Digital'),
                'prof2@ista.test' => $this->findFiliere($filieres, 'Infrastructure Digitale'),
                default => null,
            };

            Professeur::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'specialite' => $user->email === 'prof2@ista.test' ? 'Infrastructure' : 'Developpement web',
                    'filiere_id' => $filiere?->id,
                ]
            );
        }
    }

    private function findFiliere(Collection $filieres, string $expectedName): ?Filier
    {
        $expectedKey = FiliereNameNormalizer::key($expectedName);

        return $filieres->first(
            fn (Filier $filiere) => FiliereNameNormalizer::key($filiere->nom) === $expectedKey
        );
    }
}
