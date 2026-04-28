<?php

namespace Database\Seeders;

use App\Models\Filier;
use App\Models\Module;
use Illuminate\Database\Seeder;

class ModuleSeeder extends Seeder
{
    public function run(): void
    {
        $filieres = Filier::get()->keyBy('nom');

        $modules = [
            ['nom' => 'Programmation Web', 'coefficient' => 3, 'filiere_id' => $filieres['Developpement Digital']->id],
            ['nom' => 'Base de Donnees', 'coefficient' => 2, 'filiere_id' => $filieres['Developpement Digital']->id],
            ['nom' => 'Reseaux', 'coefficient' => 3, 'filiere_id' => $filieres['Infrastructure Digitale']->id],
            ['nom' => 'Systemes', 'coefficient' => 2, 'filiere_id' => $filieres['Infrastructure Digitale']->id],
        ];

        foreach ($modules as $module) {
            Module::updateOrCreate(
                ['nom' => $module['nom'], 'filiere_id' => $module['filiere_id']],
                $module
            );
        }
    }
}
