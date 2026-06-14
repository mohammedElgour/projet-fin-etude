<?php

namespace Database\Seeders;

use App\Models\Groupe;
use App\Models\Module;
use App\Models\Note;
use App\Models\NoteSubmission;
use App\Models\Professeur;
use App\Models\Stagiaire;
use Illuminate\Database\Seeder;
use RuntimeException;

class NoteSeeder extends Seeder
{
    public function run(): void
    {
        $students = Stagiaire::with(['user', 'groupe'])->get()->keyBy(fn ($stagiaire) => $stagiaire->user->email);
        $groups = Groupe::query()->get()->keyBy('nom');

        $submissions = [
            [
                'groupe' => 'DD101',
                'module_code' => 'M104',
                'status' => NoteSubmission::STATUS_APPROVED,
                'notes' => [
                    ['student' => 'sara@ista.test', 'cc1' => 15, 'cc2' => 16, 'cc3' => 17, 'efm' => 17.25],
                    ['student' => 'youssef@ista.test', 'cc1' => 11, 'cc2' => 10, 'cc3' => 12, 'efm' => 12.25],
                ],
            ],
            [
                'groupe' => 'DD102',
                'module_code' => 'M105',
                'status' => NoteSubmission::STATUS_PENDING,
                'notes' => [
                    ['student' => 'imane@ista.test', 'cc1' => 12, 'cc2' => 13, 'cc3' => 12.5, 'efm' => 14],
                    ['student' => 'hamza@ista.test', 'cc1' => 7, 'cc2' => 8, 'cc3' => 7.5, 'efm' => 8.75],
                ],
            ],
            [
                'groupe' => 'ID201',
                'module_code' => 'M103',
                'status' => NoteSubmission::STATUS_APPROVED,
                'notes' => [
                    ['student' => 'salma@ista.test', 'cc1' => 14, 'cc2' => 15, 'cc3' => 15.5, 'efm' => 15.25],
                    ['student' => 'anas@ista.test', 'cc1' => 10, 'cc2' => 9, 'cc3' => 11, 'efm' => 10],
                ],
            ],
            [
                'groupe' => 'ID201',
                'module_code' => 'M104',
                'status' => NoteSubmission::STATUS_REJECTED,
                'feedback' => 'Veuillez corriger les notes soumises.',
                'notes' => [
                    ['student' => 'salma@ista.test', 'cc1' => 11, 'cc2' => 12, 'cc3' => 12.5, 'efm' => 14],
                    ['student' => 'anas@ista.test', 'cc1' => 6.5, 'cc2' => 7, 'cc3' => 8, 'efm' => 8.75],
                ],
            ],
        ];

        foreach ($submissions as $entry) {
            $groupe = $groups[$entry['groupe']] ?? null;

            if (!$groupe) {
                throw new RuntimeException("Impossible de trouver le groupe {$entry['groupe']}.");
            }

            $module = Module::query()
                ->where('code', $entry['module_code'])
                ->where('filiere_id', $groupe->filiere_id)
                ->first();

            if (!$module) {
                throw new RuntimeException("Impossible de trouver le module {$entry['module_code']} pour le groupe {$entry['groupe']}.");
            }

            $teacher = Professeur::query()
                ->whereHas('groupes', fn ($query) => $query->where('groupes.id', $groupe->id))
                ->whereHas('modules', fn ($query) => $query->where('modules.id', $module->id))
                ->first();

            $submission = NoteSubmission::updateOrCreate(
                [
                    'groupe_id' => $groupe->id,
                    'module_id' => $module->id,
                ],
                [
                    'teacher_id' => $teacher?->id,
                    'status' => $entry['status'],
                    'submitted_at' => now(),
                    'approved_at' => $entry['status'] === NoteSubmission::STATUS_APPROVED ? now() : null,
                    'rejected_at' => $entry['status'] === NoteSubmission::STATUS_REJECTED ? now() : null,
                    'admin_comment' => $entry['feedback'] ?? null,
                ]
            );

            foreach ($entry['notes'] as $noteData) {
                $student = $students[$noteData['student']] ?? null;

                if (!$student || (int) $student->groupe_id !== (int) $groupe->id) {
                    throw new RuntimeException("Impossible de trouver l'etudiant {$noteData['student']} pour le groupe {$entry['groupe']}.");
                }

                $noteStatus = match ($entry['status']) {
                    NoteSubmission::STATUS_APPROVED => Note::STATUS_VALIDATED,
                    NoteSubmission::STATUS_REJECTED => Note::STATUS_REJECTED,
                    default => Note::STATUS_SUBMITTED,
                };

                Note::updateOrCreate(
                    [
                        'stagiaire_id' => $student->id,
                        'module_id' => $module->id,
                    ],
                    [
                        'submission_id' => $submission->id,
                        ...Note::prepareWorkflowAttributes([
                            'cc1' => $noteData['cc1'],
                            'cc2' => $noteData['cc2'],
                            'cc3' => $noteData['cc3'],
                            'efm' => $noteData['efm'],
                            'note' => round((($noteData['cc1'] + $noteData['cc2'] + $noteData['cc3'] + $noteData['efm']) / 5), 2),
                            'status' => $noteStatus,
                            'feedback' => $entry['status'] === NoteSubmission::STATUS_REJECTED ? ($entry['feedback'] ?? 'Veuillez revoir cette note.') : null,
                            'reviewed_at' => $entry['status'] === NoteSubmission::STATUS_PENDING ? null : now(),
                        ]),
                    ]
                );
            }
        }
    }
}
