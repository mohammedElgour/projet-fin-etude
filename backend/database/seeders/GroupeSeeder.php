<?php

namespace Database\Seeders;

use App\Models\Filier;
use App\Models\Groupe;
use Illuminate\Database\Seeder;

class GroupeSeeder extends Seeder
{
    public function run(): void
    {
        $filieres = Filier::get()->keyBy('nom');

        $groupes = [
            ['nom' => 'DD101', 'filiere_id' => $filieres["D\u{00E9}veloppement Digital"]->id],
            ['nom' => 'DD102', 'filiere_id' => $filieres["D\u{00E9}veloppement Digital"]->id],
            ['nom' => 'DD103', 'filiere_id' => $filieres["D\u{00E9}veloppement Digital"]->id],
            ['nom' => 'ID201', 'filiere_id' => $filieres['Infrastructure Digitale']->id],
            ['nom' => 'ID202', 'filiere_id' => $filieres['Infrastructure Digitale']->id],
            ['nom' => 'GE301', 'filiere_id' => $filieres['Gestion des Entreprises']->id],
            ['nom' => 'GED401', 'filiere_id' => $filieres["G\u{00E9}nie Electrique"]->id],
            ['nom' => 'DDES501', 'filiere_id' => $filieres['Digital Design']->id],
            ['nom' => 'THI601', 'filiere_id' => $filieres['Techniques Habillement Industrialisation']->id],
            ['nom' => 'GC701', 'filiere_id' => $filieres["G\u{00E9}nie Civil"]->id],
        ];

        foreach ($groupes as $groupe) {
            Groupe::updateOrCreate(['nom' => $groupe['nom']], $groupe);
        }
    }
}
