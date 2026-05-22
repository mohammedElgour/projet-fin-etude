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
        $professorUsers = User::query()
            ->where('role', 'professeur')
            ->get();

        $filieres = Filier::query()->get();
        $modules = Module::query()->get();
        $groupes = Groupe::query()->get();

        foreach ($professorUsers as $user) {
            $filiere = match ($user->email) {
                'prof@ista.test' => $this->findFiliere($filieres, 'Développement Digital'),
                'prof2@ista.test' => $this->findFiliere($filieres, 'Infrastructure Digitale'),
                default => null,
            };

            $professeur = Professeur::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'specialite' => $user->email === 'prof2@ista.test' ? 'Infrastructure' : 'Developpement web',
                    'filiere_id' => $filiere?->id,
                ]
            );

            if ($user->email === 'prof@ista.test') {
                $moduleIds = $this->findModuleIdsByCodes($modules, ['M104', 'M105', 'M106', 'M107'], $filiere?->id);
                $groupeIds = $this->findGroupeIds($groupes, ['DD101', 'DD102']);
            } elseif ($user->email === 'prof2@ista.test') {
                $moduleIds = $this->findModuleIdsByCodes($modules, ['M103', 'M104', 'M105', 'M106'], $filiere?->id);
                $groupeIds = $this->findGroupeIds($groupes, ['ID201']);
            } else {
                $moduleIds = [];
                $groupeIds = [];
            }

            if (!empty($moduleIds)) {
                $professeur->modules()->syncWithoutDetaching($moduleIds);
            }

            if (!empty($groupeIds)) {
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
                    && (!$filiereId || (int) $module->filiere_id === (int) $filiereId);
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
