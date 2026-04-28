<?php

namespace Database\Seeders;

use App\Models\EmploiDuTemps;
use App\Models\Groupe;
use Illuminate\Database\Seeder;

class EmploiDuTempsSeeder extends Seeder
{
    public function run(): void
    {
        $schedules = [
            [
                'groupe' => 'DD101',
                'date' => now()->toDateString(),
                'fichier' => [
                    ['jour' => 'Lundi', 'heure' => '08:30', 'module' => 'Programmation Web'],
                    ['jour' => 'Mardi', 'heure' => '10:30', 'module' => 'Base de Donnees'],
                ],
            ],
            [
                'groupe' => 'DD102',
                'date' => now()->toDateString(),
                'fichier' => [
                    ['jour' => 'Mercredi', 'heure' => '09:00', 'module' => 'Programmation Web'],
                ],
            ],
            [
                'groupe' => 'ID201',
                'date' => now()->toDateString(),
                'fichier' => [
                    ['jour' => 'Jeudi', 'heure' => '11:00', 'module' => 'Reseaux'],
                    ['jour' => 'Vendredi', 'heure' => '08:30', 'module' => 'Systemes'],
                ],
            ],
        ];

        $groups = Groupe::get()->keyBy('nom');

        foreach ($schedules as $schedule) {
            EmploiDuTemps::updateOrCreate(
                [
                    'groupe_id' => $groups[$schedule['groupe']]->id,
                    'date' => $schedule['date'],
                ],
                ['fichier' => $schedule['fichier']]
            );
        }
    }
}
