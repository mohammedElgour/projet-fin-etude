<?php

namespace Tests\Feature;

use App\Models\Module;
use App\Models\Note;
use App\Models\NoteSubmission;
use App\Models\Stagiaire;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GradeWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_professor_admin_and_student_can_complete_the_group_submission_workflow(): void
    {
        $this->seed(DatabaseSeeder::class);

        $professorUser = User::where('email', 'prof@ista.test')->firstOrFail();
        $groupe = $professorUser->professeur->groupes()->where('nom', 'DD101')->firstOrFail();
        $module = $professorUser->professeur->modules()
            ->where('code', 'M105')
            ->where('filiere_id', $groupe->filiere_id)
            ->firstOrFail();

        $students = Stagiaire::with(['user', 'groupe'])
            ->where('groupe_id', $groupe->id)
            ->orderBy('id')
            ->get();

        Sanctum::actingAs($professorUser);

        $submissionResponse = $this->postJson('/api/professeur/notes/submit', [
            'groupe_id' => $groupe->id,
            'module_id' => $module->id,
            'notes' => $students->values()->map(function (Stagiaire $student, int $index) {
                return [
                    'stagiaire_id' => $student->id,
                    'controle_1' => $index === 0 ? 20 : 10,
                    'controle_2' => $index === 0 ? 20 : 10,
                    'controle_3' => $index === 0 ? 20 : 10,
                    'efm' => $index === 0 ? 40 : 20,
                ];
            })->all(),
        ])
            ->assertOk()
            ->assertJsonPath('count', $students->count())
            ->assertJsonPath('submission.groupe_id', $groupe->id)
            ->assertJsonPath('submission.module_id', $module->id)
            ->assertJsonPath('submission.status', 'pending');

        $submissionId = $submissionResponse->json('submission.id');

        $this->assertDatabaseHas('note_submissions', [
            'id' => $submissionId,
            'groupe_id' => $groupe->id,
            'module_id' => $module->id,
            'status' => NoteSubmission::STATUS_PENDING,
        ]);

        $this->assertSame(
            1,
            NoteSubmission::query()
                ->where('groupe_id', $groupe->id)
                ->where('module_id', $module->id)
                ->count()
        );

        Sanctum::actingAs(User::where('email', 'admin@ista.test')->firstOrFail());

        $submissions = $this->getJson('/api/admin/note-submissions')
            ->assertOk()
            ->json('data');

        $matchingSubmission = collect($submissions)->first(fn ($submission) => (int) $submission['id'] === (int) $submissionId);

        $this->assertNotNull($matchingSubmission);
        $this->assertSame($students->count(), $matchingSubmission['stagiaires_count']);
        $this->assertSame('DD101', $matchingSubmission['groupe']['nom']);
        $this->assertSame('pending', $matchingSubmission['status']);

        $this->postJson('/api/admin/notes/validate-group', [
            'submission_id' => $submissionId,
        ])
            ->assertOk()
            ->assertJsonPath('submission.status', 'approved');

        $this->assertDatabaseHas('note_submissions', [
            'id' => $submissionId,
            'status' => NoteSubmission::STATUS_APPROVED,
        ]);

        $this->assertDatabaseHas('notes', [
            'submission_id' => $submissionId,
            'stagiaire_id' => $students->first()->id,
            'module_id' => $module->id,
            'validation_status' => Note::STATUS_VALIDATED,
        ]);

        Sanctum::actingAs(User::where('email', $students->first()->user->email)->firstOrFail());

        $studentNotes = $this->getJson('/api/stagiaire/notes')
            ->assertOk()
            ->assertJsonStructure([
                'notes' => [
                    '*' => ['module', 'controle1', 'controle2', 'controle3', 'efm'],
                ],
            ])
            ->json('notes');

        $matchingNote = collect($studentNotes)->first(fn ($note) => (int) ($note['module_id'] ?? 0) === (int) $module->id);

        $this->assertNotNull($matchingNote, json_encode($studentNotes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        $this->assertSame(Note::STATUS_APPROVED, $matchingNote['status']);
        $this->assertSame(Note::STATUS_APPROVED, $matchingNote['validation_status']);
        $this->assertSame(20.0, (float) $matchingNote['note']);
    }

    public function test_student_notes_endpoint_uses_approved_submission_state_even_when_note_status_is_stale(): void
    {
        $this->seed(DatabaseSeeder::class);

        $professorUser = User::where('email', 'prof@ista.test')->firstOrFail();
        $groupe = $professorUser->professeur->groupes()->where('nom', 'DD101')->firstOrFail();
        $module = $professorUser->professeur->modules()
            ->where('code', 'M105')
            ->where('filiere_id', $groupe->filiere_id)
            ->firstOrFail();

        $students = Stagiaire::with(['user', 'groupe'])
            ->where('groupe_id', $groupe->id)
            ->orderBy('id')
            ->get();

        Sanctum::actingAs($professorUser);

        $submissionResponse = $this->postJson('/api/professeur/notes/submit', [
            'groupe_id' => $groupe->id,
            'module_id' => $module->id,
            'notes' => $students->values()->map(function (Stagiaire $student, int $index) {
                return [
                    'stagiaire_id' => $student->id,
                    'controle_1' => $index === 0 ? 20 : 10,
                    'controle_2' => $index === 0 ? 20 : 10,
                    'controle_3' => $index === 0 ? 20 : 10,
                    'efm' => $index === 0 ? 40 : 20,
                ];
            })->all(),
        ])->assertOk();

        $submissionId = $submissionResponse->json('submission.id');

        Sanctum::actingAs(User::where('email', 'admin@ista.test')->firstOrFail());

        $this->postJson('/api/admin/notes/validate-group', [
            'submission_id' => $submissionId,
        ])->assertOk();

        DB::table('notes')
            ->where('submission_id', $submissionId)
            ->update([
                'status' => Note::STATUS_SUBMITTED,
                'validation_status' => Note::STATUS_SUBMITTED,
                'controle1_status' => Note::STATUS_SUBMITTED,
                'controle2_status' => Note::STATUS_SUBMITTED,
                'controle3_status' => Note::STATUS_SUBMITTED,
                'efm_status' => Note::STATUS_SUBMITTED,
                'note' => 20,
            ]);

        Sanctum::actingAs(User::where('email', $students->first()->user->email)->firstOrFail());

        $studentNotes = $this->getJson('/api/stagiaire/notes')
            ->assertOk()
            ->json('notes');

        $matchingNote = collect($studentNotes)->firstWhere('module_id', $module->id);

        $this->assertNotNull($matchingNote);
        $this->assertSame(Note::STATUS_APPROVED, $matchingNote['status']);
        $this->assertSame(Note::STATUS_APPROVED, $matchingNote['validation_status']);
        $this->assertSame(20.0, (float) $matchingNote['note']);
    }

    public function test_admin_validate_group_returns_empty_state_when_submission_has_no_notes(): void
    {
        $this->seed(DatabaseSeeder::class);

        $adminUser = User::where('email', 'admin@ista.test')->firstOrFail();
        $groupe = \App\Models\Groupe::query()->firstOrFail();
        $module = Module::query()->firstOrFail();

        foreach (\App\Models\Groupe::query()->orderBy('id')->get() as $candidateGroup) {
            $candidateModule = Module::query()
                ->orderBy('id')
                ->get()
                ->first(fn (Module $candidate) => !NoteSubmission::query()
                    ->where('groupe_id', $candidateGroup->id)
                    ->where('module_id', $candidate->id)
                    ->exists());

            if ($candidateModule) {
                $groupe = $candidateGroup;
                $module = $candidateModule;
                break;
            }
        }

        $submission = NoteSubmission::query()->create([
            'groupe_id' => $groupe->id,
            'module_id' => $module->id,
            'teacher_id' => null,
            'status' => NoteSubmission::STATUS_PENDING,
            'submitted_at' => now(),
            'approved_at' => null,
            'rejected_at' => null,
            'admin_comment' => null,
        ]);

        Sanctum::actingAs($adminUser);

        $this->postJson('/api/admin/notes/validate-group', [
            'submission_id' => $submission->id,
        ])
            ->assertOk()
            ->assertJsonPath('status', 'empty')
            ->assertJsonPath('validated', false)
            ->assertJsonPath('count', 0);
    }

    public function test_professor_and_admin_note_validation_enforces_the_new_score_limits(): void
    {
        $this->seed(DatabaseSeeder::class);

        $professorUser = User::where('email', 'prof@ista.test')->firstOrFail();
        $groupe = $professorUser->professeur->groupes()->where('nom', 'DD101')->firstOrFail();
        $module = $professorUser->professeur->modules()
            ->where('code', 'M106')
            ->where('filiere_id', $groupe->filiere_id)
            ->firstOrFail();
        $student = Stagiaire::query()->where('groupe_id', $groupe->id)->firstOrFail();

        Sanctum::actingAs($professorUser);

        $this->postJson('/api/professeur/notes', [
            'stagiaire_id' => $student->id,
            'module_id' => $module->id,
            'cc1' => 21,
            'cc2' => 20,
            'cc3' => 20,
            'efm' => 41,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['cc1', 'efm']);

        $this->postJson('/api/professeur/notes/batch', [
            'groupe_id' => $groupe->id,
            'module_id' => $module->id,
            'notes' => [[
                'stagiaire_id' => $student->id,
                'controle_1' => 21,
                'controle_2' => 20,
                'controle_3' => 20,
                'efm' => 41,
            ]],
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['notes.0.controle_1', 'notes.0.efm']);

        $validResponse = $this->postJson('/api/professeur/notes', [
            'stagiaire_id' => $student->id,
            'module_id' => $module->id,
            'cc1' => 20,
            'cc2' => 20,
            'cc3' => 20,
            'efm' => 40,
        ])
            ->assertCreated();

        $noteId = $validResponse->json('note.id');

        Sanctum::actingAs(User::where('email', 'admin@ista.test')->firstOrFail());

        $this->patchJson("/api/admin/notes/{$noteId}", [
            'efm' => 41,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['efm']);
    }

    public function test_student_timetable_endpoint_only_returns_the_authenticated_student_group_schedule(): void
    {
        $this->seed(DatabaseSeeder::class);

        $studentUser = User::where('email', 'sara@ista.test')->firstOrFail();
        Sanctum::actingAs($studentUser);

        $studentGroupName = $studentUser->stagiaire->groupe->nom;
        $studentFiliereName = $studentUser->stagiaire->groupe->filiere->nom;

        $response = $this->getJson('/api/stagiaire/emploi-du-temps')
            ->assertOk()
            ->assertJsonStructure([
                'group',
                'filiere',
                'timetable',
            ])
            ->assertJson([
                'group' => $studentGroupName,
                'filiere' => $studentFiliereName,
            ]);

        $this->assertSame($studentGroupName, $response->json('group'));
        $this->assertSame($studentFiliereName, $response->json('filiere'));
        $this->assertNull($response->json('timetable'));
    }

    public function test_student_timetables_endpoint_returns_a_successful_paginated_response(): void
    {
        $this->seed(DatabaseSeeder::class);

        $studentUser = User::where('email', 'sara@ista.test')->firstOrFail();
        Sanctum::actingAs($studentUser);

        $response = $this->getJson('/api/stagiaire/timetables')
            ->assertOk()
            ->assertJsonStructure([
                'current_page',
                'data',
                'first_page_url',
                'from',
                'last_page',
                'last_page_url',
                'links',
                'path',
                'per_page',
                'to',
                'total',
            ]);

        $this->assertIsArray($response->json('data'));
    }

    public function test_professor_can_save_all_notes_in_batch_as_a_draft_submission(): void
    {
        $this->seed(DatabaseSeeder::class);

        $professorUser = User::where('email', 'prof@ista.test')->firstOrFail();
        Sanctum::actingAs($professorUser);

        $groupe = $professorUser->professeur->groupes()->where('nom', 'DD101')->firstOrFail();
        $module = $professorUser->professeur->modules()
            ->where('code', 'M106')
            ->where('filiere_id', $groupe->filiere_id)
            ->firstOrFail();

        $students = Stagiaire::query()
            ->where('groupe_id', $groupe->id)
            ->with('groupe')
            ->take(2)
            ->get();

        $response = $this->postJson('/api/professeur/notes/batch', [
            'groupe_id' => $groupe->id,
            'module_id' => $module->id,
            'notes' => [
                [
                    'stagiaire_id' => $students[0]->id,
                    'controle_1' => 12,
                    'controle_2' => 14,
                    'controle_3' => 13,
                    'efm' => 15,
                ],
                [
                    'stagiaire_id' => $students[1]->id,
                    'controle_1' => 10,
                    'controle_2' => 11,
                    'controle_3' => 12,
                    'efm' => 13,
                ],
            ],
        ])
            ->assertOk()
            ->assertJsonPath('count', 2)
            ->assertJsonPath('notes.0.validation_status', Note::STATUS_DRAFT)
            ->assertJsonPath('submission.status', Note::STATUS_DRAFT);

        $submissionId = $response->json('submission.id');

        $this->assertDatabaseHas('note_submissions', [
            'id' => $submissionId,
            'groupe_id' => $groupe->id,
            'module_id' => $module->id,
            'submitted_at' => null,
        ]);

        $this->assertDatabaseHas('notes', [
            'submission_id' => $submissionId,
            'stagiaire_id' => $students[0]->id,
            'module_id' => $module->id,
            'validation_status' => Note::STATUS_DRAFT,
        ]);

        $this->assertDatabaseHas('notes', [
            'submission_id' => $submissionId,
            'stagiaire_id' => $students[1]->id,
            'module_id' => $module->id,
            'validation_status' => Note::STATUS_DRAFT,
        ]);
    }
}
