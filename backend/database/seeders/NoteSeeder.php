<?php

namespace Database\Seeders;

use App\Models\Module;
use App\Models\Note;
use App\Models\Stagiaire;
use Illuminate\Database\Seeder;

class NoteSeeder extends Seeder
{
    public function run(): void
    {
        $students = Stagiaire::with('user')->get()->keyBy(fn ($stagiaire) => $stagiaire->user->email);
        $modules = Module::get()->keyBy('nom');

        $notes = [
            ['student' => 'sara@ista.test', 'module' => 'Programmation Web', 'note' => 16.5, 'status' => 'validated'],
            ['student' => 'sara@ista.test', 'module' => 'Base de Donnees', 'note' => 14, 'status' => 'validated'],
            ['student' => 'youssef@ista.test', 'module' => 'Programmation Web', 'note' => 11.5, 'status' => 'pending'],
            ['student' => 'youssef@ista.test', 'module' => 'Base de Donnees', 'note' => 9.5, 'status' => 'rejected', 'feedback' => 'Corriger la saisie et confirmer la note.'],
            ['student' => 'imane@ista.test', 'module' => 'Programmation Web', 'note' => 13, 'status' => 'validated'],
            ['student' => 'hamza@ista.test', 'module' => 'Base de Donnees', 'note' => 8, 'status' => 'pending'],
            ['student' => 'salma@ista.test', 'module' => 'Reseaux', 'note' => 15, 'status' => 'validated'],
            ['student' => 'salma@ista.test', 'module' => 'Systemes', 'note' => 12.5, 'status' => 'validated'],
            ['student' => 'anas@ista.test', 'module' => 'Reseaux', 'note' => 10, 'status' => 'pending'],
            ['student' => 'anas@ista.test', 'module' => 'Systemes', 'note' => 7.5, 'status' => 'rejected', 'feedback' => 'Verifier le bareme avant nouvelle validation.'],
        ];

        foreach ($notes as $entry) {
            $status = $entry['status'];

            Note::updateOrCreate(
                [
                    'stagiaire_id' => $students[$entry['student']]->id,
                    'module_id' => $modules[$entry['module']]->id,
                ],
                [
                    'note' => $entry['note'],
                    'is_validated' => $status === 'validated',
                    'validation_status' => $status,
                    'feedback' => $entry['feedback'] ?? null,
                    'reviewed_at' => $status === 'pending' ? null : now(),
                ]
            );
        }
    }
}
