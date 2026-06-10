<?php

namespace Database\Seeders;

use App\Models\Filier;
use App\Models\Groupe;
use App\Models\Module;
use App\Models\Professeur;
use App\Models\User;
use App\Support\FiliereNameNormalizer;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class ProfesseurSeeder extends Seeder
{
    public function run(): void
    {
        $assignments = [
            [
                'email' => 'prof@ista.test',
                'specialite' => 'Développement Web',
                'filiere' => "D\u{00E9}veloppement Digital",
                'modules' => ['M104', 'M105', 'M106', 'M107'],
                'groupes' => ['DD101', 'DD102'],
            ],
            [
                'email' => 'prof2@ista.test',
                'specialite' => 'Réseaux et systèmes',
                'filiere' => 'Infrastructure Digitale',
                'modules' => ['M103', 'M104', 'M105', 'M106'],
                'groupes' => ['ID201', 'ID202'],
            ],
            [
                'email' => 'prof3@ista.test',
                'specialite' => 'JavaScript et interfaces',
                'filiere' => "D\u{00E9}veloppement Digital",
                'modules' => ['M102', 'M103', 'M105', 'M107'],
                'groupes' => ['DD102', 'DD103'],
            ],
            [
                'email' => 'prof4@ista.test',
                'specialite' => 'Base de données',
                'filiere' => "D\u{00E9}veloppement Digital",
                'modules' => ['M106', 'M107', 'M108'],
                'groupes' => ['DD101', 'DD103'],
            ],
            [
                'email' => 'prof5@ista.test',
                'specialite' => 'Support réseaux',
                'filiere' => 'Infrastructure Digitale',
                'modules' => ['M101', 'M102', 'M103', 'M108'],
                'groupes' => ['ID201', 'ID202'],
            ],
            [
                'email' => 'prof6@ista.test',
                'specialite' => 'Sécurité et virtualisation',
                'filiere' => 'Infrastructure Digitale',
                'modules' => ['M104', 'M105', 'M106', 'M107'],
                'groupes' => ['ID202'],
            ],
        ];

        $professorUsers = User::query()
            ->where('role', 'professeur')
            ->get()
            ->keyBy('email');

        $filieres = Filier::query()->get();
        $modules = Module::query()->get();
        $groupes = Groupe::query()->get();

        foreach ($assignments as $assignment) {
            $user = $professorUsers->get($assignment['email']);

            if (! $user) {
                continue;
            }

            $filiere = $this->findFiliere($filieres, $assignment['filiere']);

            $professeur = Professeur::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'specialite' => $assignment['specialite'],
                    'filiere_id' => $filiere?->id,
                ]
            );

            $moduleIds = $this->findModuleIdsByCodes($modules, $assignment['modules'], $filiere?->id);
            $groupeIds = $this->findGroupeIds($groupes, $assignment['groupes']);

            if (! empty($moduleIds)) {
                $professeur->modules()->syncWithoutDetaching($moduleIds);
            }

            if (! empty($groupeIds)) {
                $professeur->groupes()->syncWithoutDetaching($groupeIds);
            }
        }
    }

    private function findFiliere(Collection $filieres, string $expectedName): ?Filier
    {
        $expectedKey = FiliereNameNormalizer::key($expectedName);

        return $filieres->first(
            fn (Filier $filiere) => FiliereNameNormalizer::key($filiere->nom) === $expectedKey
        );
    }

    private function findModuleIdsByCodes(Collection $modules, array $expectedCodes, ?int $filiereId = null): array
    {
        $expectedKeys = array_map(fn ($code) => strtolower(trim($code)), $expectedCodes);

        return $modules
            ->filter(function (Module $module) use ($expectedKeys, $filiereId) {
                return in_array(strtolower(trim((string) $module->code)), $expectedKeys, true)
                    && (! $filiereId || (int) $module->filiere_id === (int) $filiereId);
            })
            ->pluck('id')
            ->all();
    }

    private function findGroupeIds(Collection $groupes, array $expectedGroupeNames): array
    {
        $expectedKeys = array_map(fn ($name) => strtolower(trim($name)), $expectedGroupeNames);

        return $groupes
            ->filter(function (Groupe $groupe) use ($expectedKeys) {
                return in_array(strtolower(trim((string) $groupe->nom)), $expectedKeys, true);
            })
            ->pluck('id')
            ->all();
    }
}
