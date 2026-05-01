<?php

namespace Database\Seeders;

use App\Models\EmploiDuTemps;
use App\Models\Groupe;
use App\Models\Module;
use App\Models\Professeur;
use Illuminate\Database\Seeder;

class EmploiDuTempsSeeder extends Seeder
{
    public function run(): void
    {
        $schedules = [
            [
                'groupe' => 'DD101',
                'module' => 'Programmation Web',
                'professeur' => 'prof@ista.test',
                'date' => now()->toDateString(),
                'fichier' => [
                    ['jour' => 'Lundi', 'heure_debut' => '08:30', 'heure_fin' => '10:30', 'module' => 'Programmation Web', 'salle' => 'Salle A1'],
                ],
                'day_of_week' => 'Lundi',
                'start_time' => '08:30',
                'end_time' => '10:30',
                'room' => 'Salle A1',
            ],
            [
                'groupe' => 'DD102',
                'module' => 'Programmation Web',
                'professeur' => 'prof@ista.test',
                'date' => now()->toDateString(),
                'fichier' => [
                    ['jour' => 'Mercredi', 'heure_debut' => '09:00', 'heure_fin' => '11:00', 'module' => 'Programmation Web', 'salle' => 'Salle A2'],
                ],
                'day_of_week' => 'Mercredi',
                'start_time' => '09:00',
                'end_time' => '11:00',
                'room' => 'Salle A2',
            ],
            [
                'groupe' => 'DD101',
                'module' => 'Base de Donnees',
                'professeur' => 'prof@ista.test',
                'date' => now()->toDateString(),
                'fichier' => [
                    ['jour' => 'Mardi', 'heure_debut' => '10:30', 'heure_fin' => '12:30', 'module' => 'Base de Donnees', 'salle' => 'Lab B1'],
                ],
                'day_of_week' => 'Mardi',
                'start_time' => '10:30',
                'end_time' => '12:30',
                'room' => 'Lab B1',
            ],
            [
                'groupe' => 'DD102',
                'module' => 'Base de Donnees',
                'professeur' => 'prof@ista.test',
                'date' => now()->toDateString(),
                'fichier' => [
                    ['jour' => 'Jeudi', 'heure_debut' => '14:00', 'heure_fin' => '16:00', 'module' => 'Base de Donnees', 'salle' => 'Lab B2'],
                ],
                'day_of_week' => 'Jeudi',
                'start_time' => '14:00',
                'end_time' => '16:00',
                'room' => 'Lab B2',
            ],
            [
                'groupe' => 'ID201',
                'module' => 'Reseaux',
                'professeur' => 'prof2@ista.test',
                'date' => now()->toDateString(),
                'fichier' => [
                    ['jour' => 'Jeudi', 'heure_debut' => '11:00', 'heure_fin' => '13:00', 'module' => 'Reseaux', 'salle' => 'Salle R1'],
                ],
                'day_of_week' => 'Jeudi',
                'start_time' => '11:00',
                'end_time' => '13:00',
                'room' => 'Salle R1',
            ],
            [
                'groupe' => 'ID201',
                'module' => 'Systemes',
                'professeur' => 'prof2@ista.test',
                'date' => now()->toDateString(),
                'fichier' => [
                    ['jour' => 'Vendredi', 'heure_debut' => '08:30', 'heure_fin' => '10:30', 'module' => 'Systemes', 'salle' => 'Salle S1'],
                ],
                'day_of_week' => 'Vendredi',
                'start_time' => '08:30',
                'end_time' => '10:30',
                'room' => 'Salle S1',
            ],
        ];

        $groups = Groupe::get()->keyBy('nom');
        $modules = Module::get()->keyBy('nom');
        $professors = Professeur::with('user')->get()->keyBy(fn ($prof) => $prof->user->email);

        foreach ($schedules as $schedule) {
            EmploiDuTemps::updateOrCreate(
                [
                    'groupe_id' => $groups[$schedule['groupe']]->id,
                    'module_id' => $modules[$schedule['module']]->id,
                    'professeur_id' => $professors[$schedule['professeur']]->id,
                    'date' => $schedule['date'],
                    'day_of_week' => $schedule['day_of_week'],
                    'start_time' => $schedule['start_time'],
                ],
                [
                    'fichier' => $schedule['fichier'],
                    'end_time' => $schedule['end_time'],
                    'room' => $schedule['room'],
                ]
            );
        }
    }
}
