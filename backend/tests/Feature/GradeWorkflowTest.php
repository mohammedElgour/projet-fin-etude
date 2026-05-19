<?php

namespace Tests\Feature;

use App\Models\Module;
use App\Models\Stagiaire;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GradeWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_professor_admin_and_student_can_complete_the_grade_workflow(): void
    {
        $this->seed(DatabaseSeeder::class);

        $student = Stagiaire::with(['user', 'groupe'])->whereHas('groupe', fn ($query) => $query->where('nom', 'DD101'))->firstOrFail();
        $module = Module::query()
            ->where('filiere_id', $student->groupe->filiere_id)
            ->firstOrFail();

        $this->postJson('/api/login', [
            'email' => 'prof@ista.test',
            'password' => 'password123',
        ])->assertOk();

        $professorUser = User::where('email', 'prof@ista.test')->firstOrFail();
        $professorUser->professeur->groupes()->syncWithoutDetaching([$student->groupe_id]);
        $professorUser->professeur->modules()->syncWithoutDetaching([$module->id]);

        Sanctum::actingAs($professorUser);

        $this->postJson('/api/professeur/notes', [
                'stagiaire_id' => $student->id,
                'module_id' => $module->id,
                'cc1' => 12,
                'cc2' => 14,
                'cc3' => 13,
                'efm' => 15,
            ])
            ->assertCreated()
            ->assertJsonPath('note.cc1', 12)
            ->assertJsonPath('note.efm', 15)
            ->assertJsonPath('note.moyenne', 13.8)
            ->assertJsonPath('note.validation_status', 'pending');

        $this->postJson('/api/login', [
            'email' => 'admin@ista.test',
            'password' => 'password123',
        ])->assertOk();

        Sanctum::actingAs(User::where('email', 'admin@ista.test')->firstOrFail());

        $pending = $this->getJson('/api/admin/notes/pending')
            ->assertOk()
            ->json('data');

        $matchingNote = collect($pending)->first(fn ($note) => $note['stagiaire_id'] === $student->id && $note['module_id'] === $module->id);

        $this->assertNotNull($matchingNote);

        $this->patchJson("/api/admin/notes/{$matchingNote['id']}/validate")
            ->assertOk()
            ->assertJsonPath('note.validation_status', 'validated');

        $this->postJson('/api/login', [
            'email' => $student->user->email,
            'password' => 'password123',
        ])->assertOk();

        Sanctum::actingAs(User::where('email', $student->user->email)->firstOrFail());

        $studentNotes = $this->getJson('/api/stagiaire/notes')
            ->assertOk()
            ->json();

        $this->assertTrue(
            collect($studentNotes)->contains(
                fn ($note) => $note['module_id'] === $module->id
                    && $note['validation_status'] === 'validated'
                    && (float) $note['note'] === 13.8
            )
        );
    }
}
