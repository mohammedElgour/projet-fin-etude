<?php

namespace Tests\Feature;

use App\Models\Module;
use App\Models\Notification;
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

        $student = Stagiaire::with('user')->firstOrFail();
        $module = Module::firstOrFail();

        $this->postJson('/api/login', [
            'email' => 'prof@ista.test',
            'password' => 'password123',
        ])->assertOk();

        Sanctum::actingAs(User::where('email', 'prof@ista.test')->firstOrFail());

        $this->postJson('/api/professeur/notes', [
                'stagiaire_id' => $student->id,
                'module_id' => $module->id,
                'note' => 15.75,
            ])
            ->assertCreated()
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
                fn ($note) => $note['module_id'] === $module->id && $note['validation_status'] === 'validated'
            )
        );
    }

    public function test_professor_cannot_manage_grade_without_group_and_module_assignment(): void
    {
        $this->seed(DatabaseSeeder::class);

        $student = Stagiaire::with('user')->whereHas('groupe', fn ($query) => $query->where('nom', 'ID201'))->firstOrFail();
        $module = Module::where('nom', 'Reseaux')->firstOrFail();

        Sanctum::actingAs(User::where('email', 'prof@ista.test')->firstOrFail());

        $this->postJson('/api/professeur/notes', [
            'stagiaire_id' => $student->id,
            'module_id' => $module->id,
            'note' => 13.5,
        ])
            ->assertForbidden()
            ->assertJsonPath('message', 'Vous n etes pas autorise a gerer cette note pour ce groupe et ce module.');
    }

    public function test_student_announcements_include_personal_and_role_based_notifications(): void
    {
        $this->seed(DatabaseSeeder::class);

        $studentUser = User::where('email', 'sara@ista.test')->firstOrFail();

        Notification::create([
            'user_id' => $studentUser->id,
            'title' => 'Personnel',
            'type' => 'info',
            'message' => 'Notification personnelle',
            'is_read' => false,
        ]);

        Notification::create([
            'user_id' => User::where('email', 'admin@ista.test')->firstOrFail()->id,
            'title' => 'Annonce globale',
            'type' => 'info',
            'role' => 'stagiaire',
            'message' => 'Annonce pour tous les stagiaires',
            'is_read' => false,
        ]);

        Sanctum::actingAs($studentUser);

        $announcements = $this->getJson('/api/stagiaire/announcements')
            ->assertOk()
            ->json();

        $messages = collect($announcements)->pluck('message');

        $this->assertTrue($messages->contains('Notification personnelle'));
        $this->assertTrue($messages->contains('Annonce pour tous les stagiaires'));
    }

    public function test_professor_catalog_is_limited_to_assigned_groups_and_modules(): void
    {
        $this->seed(DatabaseSeeder::class);

        Sanctum::actingAs(User::where('email', 'prof@ista.test')->firstOrFail());

        $catalog = $this->getJson('/api/professeur/catalog')
            ->assertOk()
            ->json();

        $groupNames = collect($catalog['groupes'])->pluck('nom');
        $moduleNames = collect($catalog['modules'])->pluck('nom');
        $filiereNames = collect($catalog['filieres'])->pluck('nom');

        $this->assertEqualsCanonicalizing(['DD101', 'DD102'], $groupNames->all());
        $this->assertEqualsCanonicalizing(['Programmation Web', 'Base de Donnees'], $moduleNames->all());
        $this->assertEqualsCanonicalizing(['Developpement Digital'], $filiereNames->all());
    }

    public function test_admin_cannot_validate_rejected_note(): void
    {
        $this->seed(DatabaseSeeder::class);

        $note = \App\Models\Note::where('validation_status', 'rejected')->firstOrFail();

        Sanctum::actingAs(User::where('email', 'admin@ista.test')->firstOrFail());

        $this->patchJson("/api/admin/notes/{$note->id}/validate")
            ->assertStatus(422)
            ->assertJsonPath('message', 'Only pending notes can be validated.');
    }

    public function test_professor_note_creation_and_update_persist_professeur_id(): void
    {
        $this->seed(DatabaseSeeder::class);

        $professor = User::where('email', 'prof@ista.test')->firstOrFail();
        $student = Stagiaire::with('groupe')->whereHas('groupe', fn ($query) => $query->where('nom', 'DD101'))->firstOrFail();
        $module = Module::where('nom', 'Programmation Web')->firstOrFail();

        Sanctum::actingAs($professor);

        $created = $this->postJson('/api/professeur/notes', [
            'stagiaire_id' => $student->id,
            'module_id' => $module->id,
            'note' => 18,
        ])->assertCreated();

        $noteId = $created->json('note.id');
        $professeurId = $professor->professeur->id;

        $this->assertDatabaseHas('notes', [
            'id' => $noteId,
            'professeur_id' => $professeurId,
            'note' => 18.00,
        ]);

        $this->patchJson("/api/professeur/notes/{$noteId}", [
            'note' => 17.25,
        ])->assertOk();

        $this->assertDatabaseHas('notes', [
            'id' => $noteId,
            'professeur_id' => $professeurId,
            'note' => 17.25,
        ]);
    }

    public function test_professor_cannot_modify_other_professors_note(): void
    {
        $this->seed(DatabaseSeeder::class);

        $note = \App\Models\Note::whereHas('professeur.user', fn ($query) => $query->where('email', 'prof2@ista.test'))->firstOrFail();

        Sanctum::actingAs(User::where('email', 'prof@ista.test')->firstOrFail());

        $this->patchJson("/api/professeur/notes/{$note->id}", [
            'note' => 14,
        ])
            ->assertForbidden()
            ->assertJsonPath('message', 'Cette note appartient a un autre professeur.');
    }

    public function test_student_can_only_see_own_validated_notes(): void
    {
        $this->seed(DatabaseSeeder::class);

        $studentUser = User::where('email', 'sara@ista.test')->firstOrFail();
        $otherStudent = Stagiaire::with('user')->whereHas('user', fn ($query) => $query->where('email', 'youssef@ista.test'))->firstOrFail();

        Sanctum::actingAs($studentUser);

        $notes = $this->getJson('/api/stagiaire/notes')
            ->assertOk()
            ->json();

        $noteStudentIds = collect($notes)->pluck('stagiaire_id')->unique()->values()->all();

        $this->assertSame([Stagiaire::where('user_id', $studentUser->id)->firstOrFail()->id], $noteStudentIds);
        $this->assertFalse(collect($notes)->contains(fn ($note) => $note['stagiaire_id'] === $otherStudent->id));
        $this->assertTrue(collect($notes)->every(fn ($note) => $note['validation_status'] === 'validated'));
    }

    public function test_professor_cannot_filter_students_notes_or_schedule_outside_scope(): void
    {
        $this->seed(DatabaseSeeder::class);

        Sanctum::actingAs(User::where('email', 'prof@ista.test')->firstOrFail());

        $this->getJson('/api/professeur/stagiaires?groupe_id=3')
            ->assertForbidden()
            ->assertJsonPath('message', 'Unauthorized access to this groupe.');

        $this->getJson('/api/professeur/notes?module_id=3')
            ->assertForbidden()
            ->assertJsonPath('message', 'Unauthorized access to this module.');

        $this->getJson('/api/professeur/schedule?groupe_id=3')
            ->assertForbidden()
            ->assertJsonPath('message', 'Unauthorized access to this groupe.');
    }

    public function test_professor_student_listing_only_includes_own_notes_scope(): void
    {
        $this->seed(DatabaseSeeder::class);

        Sanctum::actingAs(User::where('email', 'prof@ista.test')->firstOrFail());

        $students = $this->getJson('/api/professeur/stagiaires?per_page=100')
            ->assertOk()
            ->json('data');

        $allGroupsOwned = collect($students)->every(fn ($student) => in_array($student['groupe']['nom'], ['DD101', 'DD102'], true));
        $allNotesOwned = collect($students)
            ->flatMap(fn ($student) => $student['notes'] ?? [])
            ->every(fn ($note) => $note['professeur_id'] === 1);

        $this->assertTrue($allGroupsOwned);
        $this->assertTrue($allNotesOwned);
    }

    public function test_professor_dashboard_stats_are_scoped_to_assignments(): void
    {
        $this->seed(DatabaseSeeder::class);

        Sanctum::actingAs(User::where('email', 'prof@ista.test')->firstOrFail());

        $stats = $this->getJson('/api/professeur/dashboard/stats')
            ->assertOk()
            ->json('kpis');

        $this->assertSame(1, $stats['filieres']);
        $this->assertSame(2, $stats['groupes']);
        $this->assertSame(4, $stats['students']);
        $this->assertSame(6, $stats['notes']);
    }
}
