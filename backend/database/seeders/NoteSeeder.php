<?php

namespace Database\Seeders;

use App\Models\Module;
use App\Models\Note;
use App\Models\Stagiaire;
use Illuminate\Database\Seeder;
use RuntimeException;

class NoteSeeder extends Seeder
{
    public function run(): void
    {
        $students = Stagiaire::with(['user', 'groupe'])->get()->keyBy(fn ($stagiaire) => $stagiaire->user->email);

        $notes = [
            ['student' => 'sara@ista.test', 'module_code' => 'M104', 'note' => 16.5, 'status' => 'validated'],
            ['student' => 'sara@ista.test', 'module_code' => 'M106', 'note' => 14, 'status' => 'validated'],
            ['student' => 'youssef@ista.test', 'module_code' => 'M104', 'note' => 11.5, 'status' => 'pending'],
            ['student' => 'youssef@ista.test', 'module_code' => 'M106', 'note' => 9.5, 'status' => 'rejected', 'feedback' => 'Corriger la saisie et confirmer la note.'],
            ['student' => 'imane@ista.test', 'module_code' => 'M105', 'note' => 13, 'status' => 'validated'],
            ['student' => 'hamza@ista.test', 'module_code' => 'M107', 'note' => 8, 'status' => 'pending'],
            ['student' => 'salma@ista.test', 'module_code' => 'M103', 'note' => 15, 'status' => 'validated'],
            ['student' => 'salma@ista.test', 'module_code' => 'M107', 'note' => 12.5, 'status' => 'validated'],
            ['student' => 'anas@ista.test', 'module_code' => 'M105', 'note' => 10, 'status' => 'pending'],
            ['student' => 'anas@ista.test', 'module_code' => 'M108', 'note' => 7.5, 'status' => 'rejected', 'feedback' => 'Verifier le bareme avant nouvelle validation.'],
        ];

        foreach ($notes as $entry) {
            $status = $entry['status'];
            $student = $students[$entry['student']] ?? null;
            $module = $student
                ? Module::query()
                    ->where('code', $entry['module_code'])
                    ->where('filiere_id', $student->groupe->filiere_id)
                    ->first()
                : null;

            if (!$student || !$module) {
                throw new RuntimeException("Impossible de trouver l'etudiant ou le module pour {$entry['student']} / {$entry['module_code']}.");
            }

            Note::updateOrCreate(
                [
                    'stagiaire_id' => $student->id,
                    'module_id' => $module->id,
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
