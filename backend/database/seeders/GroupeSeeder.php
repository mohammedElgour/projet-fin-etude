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
            ['nom' => 'ID201', 'filiere_id' => $filieres['Infrastructure Digitale']->id],
        ];

        foreach ($groupes as $groupe) {
            Groupe::updateOrCreate(['nom' => $groupe['nom']], $groupe);
        }
    }
}
