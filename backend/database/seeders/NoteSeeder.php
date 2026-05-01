<?php

namespace Database\Seeders;

use App\Models\Module;
use App\Models\Note;
use App\Models\Professeur;
use App\Models\Stagiaire;
use Illuminate\Database\Seeder;

class NoteSeeder extends Seeder
{
    public function run(): void
    {
        $students = Stagiaire::with('user')->get()->keyBy(fn ($stagiaire) => $stagiaire->user->email);
        $modules = Module::get()->keyBy('nom');
        $professors = Professeur::with('user')->get()->keyBy(fn ($professeur) => $professeur->user->email);

        $notes = [
            ['student' => 'sara@ista.test', 'module' => 'Programmation Web', 'note' => 16.5, 'status' => 'validated', 'created_at' => '2025-09-12 09:00:00', 'reviewed_at' => '2025-09-14 10:00:00'],
            ['student' => 'sara@ista.test', 'module' => 'Base de Donnees', 'note' => 14, 'status' => 'validated', 'created_at' => '2025-10-10 09:00:00', 'reviewed_at' => '2025-10-12 11:00:00'],
            ['student' => 'youssef@ista.test', 'module' => 'Programmation Web', 'note' => 11.5, 'status' => 'pending', 'created_at' => '2025-11-06 08:30:00'],
            ['student' => 'youssef@ista.test', 'module' => 'Base de Donnees', 'note' => 9.5, 'status' => 'rejected', 'feedback' => 'Corriger la saisie et confirmer la note.', 'created_at' => '2025-11-09 14:00:00', 'reviewed_at' => '2025-11-11 16:00:00'],
            ['student' => 'imane@ista.test', 'module' => 'Programmation Web', 'note' => 13, 'status' => 'validated', 'created_at' => '2025-11-15 10:00:00', 'reviewed_at' => '2025-11-16 13:00:00'],
            ['student' => 'hamza@ista.test', 'module' => 'Base de Donnees', 'note' => 8, 'status' => 'pending', 'created_at' => '2025-12-03 12:00:00'],
            ['student' => 'salma@ista.test', 'module' => 'Reseaux', 'note' => 15, 'status' => 'validated', 'created_at' => '2025-12-06 09:15:00', 'reviewed_at' => '2025-12-08 10:15:00'],
            ['student' => 'salma@ista.test', 'module' => 'Systemes', 'note' => 12.5, 'status' => 'validated', 'created_at' => '2026-01-07 11:00:00', 'reviewed_at' => '2026-01-10 12:30:00'],
            ['student' => 'anas@ista.test', 'module' => 'Reseaux', 'note' => 10, 'status' => 'pending', 'created_at' => '2026-02-01 08:45:00'],
            ['student' => 'anas@ista.test', 'module' => 'Systemes', 'note' => 7.5, 'status' => 'rejected', 'feedback' => 'Verifier le bareme avant nouvelle validation.', 'created_at' => '2026-02-04 15:30:00', 'reviewed_at' => '2026-02-05 09:00:00'],
        ];

        foreach ($notes as $entry) {
            $status = $entry['status'];
            $moduleName = $entry['module'];
            $professorEmail = in_array($moduleName, ['Programmation Web', 'Base de Donnees'], true)
                ? 'prof@ista.test'
                : 'prof2@ista.test';

            Note::updateOrCreate(
                [
                    'stagiaire_id' => $students[$entry['student']]->id,
                    'module_id' => $modules[$entry['module']]->id,
                ],
                [
                    'professeur_id' => $professors[$professorEmail]->id,
                    'note' => $entry['note'],
                    'is_validated' => $status === 'validated',
                    'validation_status' => $status,
                    'feedback' => $entry['feedback'] ?? null,
                    'reviewed_at' => $entry['reviewed_at'] ?? ($status === 'pending' ? null : now()),
                    'created_at' => $entry['created_at'] ?? now(),
                    'updated_at' => $entry['reviewed_at'] ?? $entry['created_at'] ?? now(),
                ]
            );
        }
    }
}
