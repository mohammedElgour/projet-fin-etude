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
            "D\u{00E9}veloppement Digital",
            'DÃ©veloppement Digital',
            'Developpement Digital',
        ]);

        $infra = $this->findFiliere([
            'Infrastructure',
            'Infrastructure Digitale',
        ]);

        $modules = [
            ['code' => 'M101', 'nom' => 'Se situer au regard du mÃ©tier et de la dÃ©marche de formation', 'coefficient' => 1, 'filiere_id' => $dev->id],
            ['code' => 'M102', 'nom' => 'AcquÃ©rir les bases de lâ€™algorithmique', 'coefficient' => 1, 'filiere_id' => $dev->id],
            ['code' => 'M103', 'nom' => 'Programmer en OrientÃ© Objet', 'coefficient' => 1, 'filiere_id' => $dev->id],
            ['code' => 'M104', 'nom' => 'DÃ©velopper des sites web statiques', 'coefficient' => 1, 'filiere_id' => $dev->id],
            ['code' => 'M105', 'nom' => 'Programmer en JavaScript', 'coefficient' => 1, 'filiere_id' => $dev->id],
            ['code' => 'M106', 'nom' => 'Manipuler des bases de donnÃ©es', 'coefficient' => 1, 'filiere_id' => $dev->id],
            ['code' => 'M107', 'nom' => 'DÃ©velopper des sites web dynamiques', 'coefficient' => 1, 'filiere_id' => $dev->id],
            ['code' => 'M108', 'nom' => 'Sâ€™initier Ã  la sÃ©curitÃ© des systÃ¨mes dâ€™information', 'coefficient' => 1, 'filiere_id' => $dev->id],
            ['code' => 'M101', 'nom' => 'Se situer au regard du mÃ©tier et de la dÃ©marche de formation', 'coefficient' => 1, 'filiere_id' => $infra->id],
            ['code' => 'M102', 'nom' => 'Comprendre les enjeux dâ€™un systÃ¨me dâ€™information', 'coefficient' => 1, 'filiere_id' => $infra->id],
            ['code' => 'M103', 'nom' => 'Concevoir un rÃ©seau informatique', 'coefficient' => 1, 'filiere_id' => $infra->id],
            ['code' => 'M104', 'nom' => 'Fonctionnement du systÃ¨me dâ€™exploitation', 'coefficient' => 1, 'filiere_id' => $infra->id],
            ['code' => 'M105', 'nom' => 'GÃ©rer une infrastructure virtualisÃ©e', 'coefficient' => 1, 'filiere_id' => $infra->id],
            ['code' => 'M106', 'nom' => 'Automatiser les tÃ¢ches dâ€™administration', 'coefficient' => 1, 'filiere_id' => $infra->id],
            ['code' => 'M107', 'nom' => 'SÃ©curiser un systÃ¨me dâ€™information', 'coefficient' => 1, 'filiere_id' => $infra->id],
            ['code' => 'M108', 'nom' => 'DÃ©velopper une veille technologique', 'coefficient' => 1, 'filiere_id' => $infra->id],
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
