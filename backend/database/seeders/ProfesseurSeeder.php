<?php

namespace Database\Seeders;

use App\Models\Groupe;
use App\Models\Module;
use App\Models\Professeur;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class ProfesseurSeeder extends Seeder
{
    public function run(): void
    {
        $assignments = [
            [
                'email' => 'prof@ista.test',
                'specialite' => 'DÃ©veloppement Web',
                'modules' => ['M104', 'M105', 'M106', 'M107'],
                'groupes' => ['DD101', 'DD102'],
            ],
            [
                'email' => 'prof2@ista.test',
                'specialite' => 'RÃ©seaux et systÃ¨mes',
                'modules' => ['M103', 'M104', 'M105', 'M106'],
                'groupes' => ['ID201', 'ID202'],
            ],
            [
                'email' => 'prof3@ista.test',
                'specialite' => 'JavaScript et interfaces',
                'modules' => ['M102', 'M103', 'M105', 'M107'],
                'groupes' => ['DD102', 'DD103'],
            ],
            [
                'email' => 'prof4@ista.test',
                'specialite' => 'Base de donnÃ©es',
                'modules' => ['M106', 'M107', 'M108'],
                'groupes' => ['DD101', 'DD103'],
            ],
            [
                'email' => 'prof5@ista.test',
                'specialite' => 'Support rÃ©seaux',
                'modules' => ['M101', 'M102', 'M103', 'M108'],
                'groupes' => ['ID201', 'ID202'],
            ],
            [
                'email' => 'prof6@ista.test',
                'specialite' => 'SÃ©curitÃ© et virtualisation',
                'modules' => ['M104', 'M105', 'M106', 'M107'],
                'groupes' => ['ID202'],
            ],
        ];

        $professorUsers = User::query()
            ->where('role', 'professeur')
            ->get()
            ->keyBy('email');

        $modules = Module::query()->get();
        $groupes = Groupe::query()->get();

        foreach ($assignments as $assignment) {
            $user = $professorUsers->get($assignment['email']);

            if (! $user) {
                continue;
            }

            $professeur = Professeur::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'specialite' => $assignment['specialite'],
                ]
            );

            $moduleIds = $this->findModuleIdsByCodes($modules, $assignment['modules']);
            $groupeIds = $this->findGroupeIds($groupes, $assignment['groupes']);

            if (! empty($moduleIds)) {
                $professeur->modules()->syncWithoutDetaching($moduleIds);
            }

            if (! empty($groupeIds)) {
                $professeur->groupes()->syncWithoutDetaching($groupeIds);
            }
        }
    }

    private function findModuleIdsByCodes(Collection $modules, array $expectedCodes): array
    {
        $expectedKeys = array_map(fn ($code) => strtolower(trim($code)), $expectedCodes);

        return $modules
            ->filter(function (Module $module) use ($expectedKeys) {
                return in_array(strtolower(trim((string) $module->code)), $expectedKeys, true);
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
