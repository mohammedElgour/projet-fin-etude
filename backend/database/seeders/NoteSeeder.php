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
            ['student' => 'sara@ista.test', 'module_code' => 'M104', 'cc1' => 15, 'cc2' => 16, 'cc3' => 17, 'efm' => 17.25, 'status' => 'validated'],
            ['student' => 'sara@ista.test', 'module_code' => 'M106', 'cc1' => 13, 'cc2' => 14, 'cc3' => 15, 'efm' => 14, 'status' => 'validated'],
            ['student' => 'youssef@ista.test', 'module_code' => 'M104', 'cc1' => 11, 'cc2' => 10, 'cc3' => 12, 'efm' => 12.25, 'status' => 'pending'],
            ['student' => 'youssef@ista.test', 'module_code' => 'M106', 'cc1' => 8, 'cc2' => 9, 'cc3' => 10, 'efm' => 10.75, 'status' => 'rejected', 'feedback' => 'Corriger la saisie et confirmer la note.'],
            ['student' => 'imane@ista.test', 'module_code' => 'M105', 'cc1' => 12, 'cc2' => 13, 'cc3' => 12.5, 'efm' => 14, 'status' => 'validated'],
            ['student' => 'hamza@ista.test', 'module_code' => 'M107', 'cc1' => 7, 'cc2' => 8, 'cc3' => 7.5, 'efm' => 8.75, 'status' => 'pending'],
            ['student' => 'salma@ista.test', 'module_code' => 'M103', 'cc1' => 14, 'cc2' => 15, 'cc3' => 15.5, 'efm' => 15.25, 'status' => 'validated'],
            ['student' => 'salma@ista.test', 'module_code' => 'M107', 'cc1' => 11, 'cc2' => 12, 'cc3' => 12.5, 'efm' => 14, 'status' => 'validated'],
            ['student' => 'anas@ista.test', 'module_code' => 'M105', 'cc1' => 10, 'cc2' => 9, 'cc3' => 11, 'efm' => 10, 'status' => 'pending'],
            ['student' => 'anas@ista.test', 'module_code' => 'M108', 'cc1' => 6.5, 'cc2' => 7, 'cc3' => 8, 'efm' => 8.75, 'status' => 'rejected', 'feedback' => 'Verifier le bareme avant nouvelle validation.'],
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
                    'cc1' => $entry['cc1'],
                    'cc2' => $entry['cc2'],
                    'cc3' => $entry['cc3'],
                    'efm' => $entry['efm'],
                    'note' => round((($entry['cc1'] + $entry['cc2'] + $entry['cc3'] + ($entry['efm'] * 2)) / 5), 2),
                    'is_validated' => $status === 'validated',
                    'validation_status' => $status,
                    'feedback' => $entry['feedback'] ?? null,
                    'reviewed_at' => $status === 'pending' ? null : now(),
                ]
            );
        }
    }
}
