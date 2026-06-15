<?php

namespace Tests\Feature;

use App\Models\Note;
use App\Models\NoteHistory;
use App\Models\NoteSubmission;
use App\Models\Stagiaire;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GradeRecoverySystemTest extends TestCase
{
    use RefreshDatabase;

    private function submitAndApproveSingleGrade(array $grades = []): array
    {
        $professorUser = User::where('email', 'prof@ista.test')->firstOrFail();
        $groupe = $professorUser->professeur->groupes()->where('nom', 'DD101')->firstOrFail();
        $module = $professorUser->professeur->modules()
            ->where('code', 'M105')
            ->where('filiere_id', $groupe->filiere_id)
            ->firstOrFail();
        $student = Stagiaire::with('user')
            ->where('groupe_id', $groupe->id)
            ->orderBy('id')
            ->firstOrFail();

        Sanctum::actingAs($professorUser);

        $payload = array_merge([
            'stagiaire_id' => $student->id,
            'module_id' => $module->id,
            'cc1' => 20,
            'cc2' => 20,
            'cc3' => 20,
            'efm' => 40,
        ], $grades);

        $noteResponse = $this->postJson('/api/professeur/notes/submit', [
            'groupe_id' => $groupe->id,
            'module_id' => $module->id,
            'notes' => [[
                'stagiaire_id' => $student->id,
                'controle_1' => $payload['cc1'],
                'controle_2' => $payload['cc2'],
                'controle_3' => $payload['cc3'],
                'efm' => $payload['efm'],
            ]],
        ])->assertOk();

        $noteId = $noteResponse->json('notes.0.id');
        $submissionId = $noteResponse->json('submission.id');

        Sanctum::actingAs(User::where('email', 'admin@ista.test')->firstOrFail());

        $this->postJson('/api/admin/notes/validate-group', [
            'submission_id' => $submissionId,
        ])->assertOk();

        return [
            'student' => $student,
            'groupe' => $groupe,
            'module' => $module,
            'note_id' => $noteId,
            'submission_id' => $submissionId,
        ];
    }

    public function test_grade_workflow_persists_submission_snapshots_history_and_student_visibility(): void
    {
        $this->seed(DatabaseSeeder::class);

        $workflow = $this->submitAndApproveSingleGrade();

        $this->assertDatabaseHas('note_submissions', [
            'id' => $workflow['submission_id'],
            'groupe_id' => $workflow['groupe']->id,
            'module_id' => $workflow['module']->id,
            'status' => NoteSubmission::STATUS_APPROVED,
            'cc1' => 20,
            'cc2' => 20,
            'cc3' => 20,
            'efm' => 40,
            'final_grade' => 20,
        ]);

        $this->assertGreaterThan(
            0,
            NoteHistory::query()->where('note_id', $workflow['note_id'])->count()
        );

        $this->assertDatabaseHas('notes', [
            'id' => $workflow['note_id'],
            'submission_id' => $workflow['submission_id'],
            'cc1' => 20,
            'cc2' => 20,
            'cc3' => 20,
            'efm' => 40,
            'note' => 20,
            'status' => Note::STATUS_VALIDATED,
            'validation_status' => Note::STATUS_APPROVED,
        ]);

        Sanctum::actingAs(User::findOrFail($workflow['student']->user_id));

        $studentNotes = $this->getJson('/api/stagiaire/notes')
            ->assertOk()
            ->json('notes');

        $matchingNote = collect($studentNotes)->first(fn (array $note) => (int) $note['module_id'] === (int) $workflow['module']->id);

        $this->assertNotNull($matchingNote);
        $this->assertSame(20.0, (float) $matchingNote['controle1']);
        $this->assertSame(20.0, (float) $matchingNote['controle2']);
        $this->assertSame(20.0, (float) $matchingNote['controle3']);
        $this->assertSame(40.0, (float) $matchingNote['efm']);
        $this->assertSame(20.0, (float) $matchingNote['note']);
        $this->assertSame('approved', $matchingNote['validation_status']);
    }

    public function test_notes_repair_command_restores_a_detached_note_from_history(): void
    {
        $this->seed(DatabaseSeeder::class);

        $workflow = $this->submitAndApproveSingleGrade();

        Note::query()
            ->whereKey($workflow['note_id'])
            ->update([
                'submission_id' => null,
                'cc1' => null,
                'cc2' => null,
                'cc3' => null,
                'efm' => null,
                'note' => null,
                'status' => Note::STATUS_SUBMITTED,
                'validation_status' => Note::STATUS_SUBMITTED,
                'controle1_status' => Note::STATUS_DRAFT,
                'controle2_status' => Note::STATUS_DRAFT,
                'controle3_status' => Note::STATUS_DRAFT,
                'efm_status' => Note::STATUS_DRAFT,
            ]);

        Artisan::call('notes:repair');

        $this->assertDatabaseHas('notes', [
            'id' => $workflow['note_id'],
            'submission_id' => $workflow['submission_id'],
            'cc1' => 20,
            'cc2' => 20,
            'cc3' => 20,
            'efm' => 40,
            'note' => 20,
            'status' => Note::STATUS_VALIDATED,
            'validation_status' => Note::STATUS_APPROVED,
        ]);

        $this->assertDatabaseHas('note_submissions', [
            'id' => $workflow['submission_id'],
            'cc1' => 20,
            'cc2' => 20,
            'cc3' => 20,
            'efm' => 40,
            'final_grade' => 20,
        ]);
    }
}
