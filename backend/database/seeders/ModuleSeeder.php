<?php

namespace Database\Seeders;

use App\Models\Filier;
use App\Models\Module;
use Illuminate\Database\Seeder;
use RuntimeException;

class ModuleSeeder extends Seeder
{
    public function run(): void
    {
        $dev = $this->findFiliere([
            'Développement Digital',
            "D\u{00E9}veloppement Digital",
            'DÃ©veloppement Digital',
            'DÃƒÂ©veloppement Digital',
            'Developpement Digital',
        ]);

        $infra = $this->findFiliere([
            'Infrastructure',
            'Infrastructure Digitale',
        ]);

        $modules = [
            ['code' => 'M101', 'nom' => 'Se situer au regard du métier et de la démarche de formation', 'coefficient' => 1, 'filiere_id' => $dev->id],
            ['code' => 'M102', 'nom' => 'Acquérir les bases de l’algorithmique', 'coefficient' => 1, 'filiere_id' => $dev->id],
            ['code' => 'M103', 'nom' => 'Programmer en Orienté Objet', 'coefficient' => 1, 'filiere_id' => $dev->id],
            ['code' => 'M104', 'nom' => 'Développer des sites web statiques', 'coefficient' => 1, 'filiere_id' => $dev->id],
            ['code' => 'M105', 'nom' => 'Programmer en JavaScript', 'coefficient' => 1, 'filiere_id' => $dev->id],
            ['code' => 'M106', 'nom' => 'Manipuler des bases de données', 'coefficient' => 1, 'filiere_id' => $dev->id],
            ['code' => 'M107', 'nom' => 'Développer des sites web dynamiques', 'coefficient' => 1, 'filiere_id' => $dev->id],
            ['code' => 'M108', 'nom' => 'S’initier à la sécurité des systèmes d’information', 'coefficient' => 1, 'filiere_id' => $dev->id],
            ['code' => 'M101', 'nom' => 'Se situer au regard du métier et de la démarche de formation', 'coefficient' => 1, 'filiere_id' => $infra->id],
            ['code' => 'M102', 'nom' => 'Comprendre les enjeux d’un système d’information', 'coefficient' => 1, 'filiere_id' => $infra->id],
            ['code' => 'M103', 'nom' => 'Concevoir un réseau informatique', 'coefficient' => 1, 'filiere_id' => $infra->id],
            ['code' => 'M104', 'nom' => 'Fonctionnement du système d’exploitation', 'coefficient' => 1, 'filiere_id' => $infra->id],
            ['code' => 'M105', 'nom' => 'Gérer une infrastructure virtualisée', 'coefficient' => 1, 'filiere_id' => $infra->id],
            ['code' => 'M106', 'nom' => 'Automatiser les tâches d’administration', 'coefficient' => 1, 'filiere_id' => $infra->id],
            ['code' => 'M107', 'nom' => 'Sécuriser un système d’information', 'coefficient' => 1, 'filiere_id' => $infra->id],
            ['code' => 'M108', 'nom' => 'Développer une veille technologique', 'coefficient' => 1, 'filiere_id' => $infra->id],
        ];

        Module::query()
            ->whereIn('filiere_id', [$dev->id, $infra->id])
            ->whereNull('code')
            ->delete();

        foreach ($modules as $module) {
            Module::updateOrCreate(
                ['code' => $module['code'], 'filiere_id' => $module['filiere_id']],
                $module
            );
        }
    }

    private function findFiliere(array $names): Filier
    {
        $filiere = Filier::query()
            ->whereIn('nom', $names)
            ->first();

        if (!$filiere) {
            throw new RuntimeException('Filiere introuvable pour: ' . implode(', ', $names));
        }

        return $filiere;
    }
}
