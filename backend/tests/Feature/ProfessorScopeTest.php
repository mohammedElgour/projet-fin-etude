<?php

namespace Tests\Feature;

use App\Models\Groupe;
use App\Models\Module;
use App\Models\Note;
use App\Models\Professeur;
use App\Models\Stagiaire;
use App\Models\Timetable;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProfessorScopeTest extends TestCase
{
    use RefreshDatabase;

    public function test_professor_catalog_returns_all_assigned_group_filieres(): void
    {
        $this->seed(DatabaseSeeder::class);

        $professorUser = User::where('email', 'prof@ista.test')->firstOrFail();
        $professor = $professorUser->professeur;

        $ddGroup = Groupe::query()->where('nom', 'DD101')->firstOrFail();
        $infraGroup = Groupe::query()->where('nom', 'ID201')->firstOrFail();
        $ddModule = Module::query()->where('filiere_id', $ddGroup->filiere_id)->where('code', 'M104')->firstOrFail();
        $infraModule = Module::query()->where('filiere_id', $infraGroup->filiere_id)->where('code', 'M103')->firstOrFail();

        $professor->groupes()->sync([$ddGroup->id, $infraGroup->id]);
        $professor->modules()->sync([$ddModule->id, $infraModule->id]);

        Sanctum::actingAs($professorUser);

        $response = $this->getJson('/api/professeur/catalog')
            ->assertOk()
            ->json();

        $groupNames = collect($response['groupes'] ?? [])->pluck('nom');
        $filieres = collect($response['filieres'] ?? [])->pluck('nom');

        $this->assertTrue($groupNames->contains('DD101'));
        $this->assertTrue($groupNames->contains('ID201'));
        $this->assertTrue($filieres->contains($ddGroup->filiere->nom));
        $this->assertTrue($filieres->contains($infraGroup->filiere->nom));
    }

    public function test_admin_can_create_professor_without_selecting_filiere(): void
    {
        $this->seed(DatabaseSeeder::class);

        $admin = User::where('role', 'admin')->firstOrFail();
        $ddGroup = Groupe::query()->where('nom', 'DD101')->firstOrFail();
        $infraGroup = Groupe::query()->where('nom', 'ID201')->firstOrFail();
        $ddModule = Module::query()->where('filiere_id', $ddGroup->filiere_id)->where('code', 'M104')->firstOrFail();
        $infraModule = Module::query()->where('filiere_id', $infraGroup->filiere_id)->where('code', 'M103')->firstOrFail();

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/admin/professeurs', [
            'first_name' => 'Yassine',
            'last_name' => 'El Amrani',
            'email' => 'yassine.amrani@ista.test',
            'password' => 'password123',
            'groups' => [$ddGroup->id, $infraGroup->id],
            'modules' => [$ddModule->id, $infraModule->id],
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.email', 'yassine.amrani@ista.test');

        $this->assertDatabaseHas('users', [
            'email' => 'yassine.amrani@ista.test',
            'role' => 'professeur',
        ]);

        $createdProfessor = Professeur::query()
            ->whereHas('user', fn ($query) => $query->where('email', 'yassine.amrani@ista.test'))
            ->with(['groupes.filiere', 'modules.filiere'])
            ->firstOrFail();

        $this->assertCount(2, $createdProfessor->groupes);
        $this->assertCount(2, $createdProfessor->modules);
        $this->assertCount(2, $response->json('filieres'));
        $this->assertTrue(collect($response->json('filieres'))->pluck('nom')->contains($ddGroup->filiere->nom));
        $this->assertTrue(collect($response->json('filieres'))->pluck('nom')->contains($infraGroup->filiere->nom));
    }

    public function test_professor_cannot_insert_note_outside_his_assignments(): void
    {
        $this->seed(DatabaseSeeder::class);

        $infraStudent = Stagiaire::query()
            ->whereHas('groupe', fn ($query) => $query->where('nom', 'ID201'))
            ->firstOrFail();

        $infraModule = Module::query()
            ->whereHas('filiere', fn ($query) => $query->where('nom', 'Infrastructure Digitale'))
            ->firstOrFail();

        Sanctum::actingAs(User::where('email', 'prof@ista.test')->firstOrFail());

        $this->postJson('/api/professeur/notes', [
            'stagiaire_id' => $infraStudent->id,
            'module_id' => $infraModule->id,
            'cc1' => 14,
            'cc2' => 14.5,
            'cc3' => 15,
            'efm' => 14,
        ])->assertStatus(403);
    }

    public function test_professor_cannot_batch_insert_note_outside_selected_groupe(): void
    {
        $this->seed(DatabaseSeeder::class);

        $professorUser = User::where('email', 'prof@ista.test')->firstOrFail();
        $profGroup = $professorUser->professeur->groupes()->firstOrFail();
        $profModule = $professorUser->professeur->modules()->firstOrFail();
        $outsideStudent = Stagiaire::query()
            ->where('groupe_id', '!=', $profGroup->id)
            ->firstOrFail();

        Sanctum::actingAs($professorUser);

        $this->postJson('/api/professeur/notes/batch', [
            'groupe_id' => $profGroup->id,
            'module_id' => $profModule->id,
            'notes' => [
                [
                    'stagiaire_id' => $outsideStudent->id,
                    'controle_1' => 14,
                    'controle_2' => 13,
                    'controle_3' => 15,
                    'efm' => 16,
                ],
            ],
        ])->assertStatus(422);
    }

    public function test_professor_stagiaires_endpoint_returns_only_notes_for_the_selected_module(): void
    {
        $this->seed(DatabaseSeeder::class);

        $professorUser = User::where('email', 'prof@ista.test')->firstOrFail();
        $student = Stagiaire::query()
            ->whereHas('groupe', fn ($query) => $query->where('nom', 'DD101'))
            ->firstOrFail();

        $moduleA = Module::query()
            ->where('filiere_id', $student->groupe->filiere_id)
            ->where('code', 'M106')
            ->firstOrFail();

        $moduleB = Module::query()
            ->where('filiere_id', $student->groupe->filiere_id)
            ->where('code', 'M107')
            ->firstOrFail();

        Note::query()
            ->where('stagiaire_id', $student->id)
            ->whereIn('module_id', [$moduleA->id, $moduleB->id])
            ->delete();

        $professorUser->professeur->groupes()->syncWithoutDetaching([$student->groupe_id]);
        $professorUser->professeur->modules()->syncWithoutDetaching([$moduleA->id, $moduleB->id]);

        Sanctum::actingAs($professorUser);

        $this->postJson('/api/professeur/notes/batch', [
            'groupe_id' => $student->groupe_id,
            'module_id' => $moduleA->id,
            'notes' => [[
                'stagiaire_id' => $student->id,
                'controle_1' => 20,
                'controle_2' => 19,
                'controle_3' => 18,
                'efm' => 17,
            ]],
        ])->assertOk();

        $this->postJson('/api/professeur/notes/batch', [
            'groupe_id' => $student->groupe_id,
            'module_id' => $moduleB->id,
            'notes' => [[
                'stagiaire_id' => $student->id,
                'controle_1' => 12,
                'controle_2' => 11,
                'controle_3' => 10,
                'efm' => 9,
            ]],
        ])->assertOk();

        $response = $this->getJson("/api/professeur/stagiaires?groupe_id={$student->groupe_id}&module_id={$moduleB->id}")
            ->assertOk()
            ->json();

        $studentPayload = collect($response)->firstWhere('id', $student->id);

        $this->assertNotNull($studentPayload);
        $this->assertCount(1, $studentPayload['notes']);
        $this->assertSame($moduleB->id, $studentPayload['notes'][0]['module_id']);
        $this->assertEquals(12.0, $studentPayload['notes'][0]['cc1']);
        $this->assertEquals(11.0, $studentPayload['notes'][0]['cc2']);
        $this->assertEquals(10.0, $studentPayload['notes'][0]['cc3']);
        $this->assertEquals(9.0, $studentPayload['notes'][0]['efm']);
        $this->assertSame(Note::STATUS_DRAFT, $studentPayload['notes'][0]['status']);
        $this->assertNotNull($studentPayload['notes'][0]['submission_id']);
    }

    public function test_professor_emploi_du_temps_endpoint_returns_only_authenticated_professor_timetables(): void
    {
        $this->seed(DatabaseSeeder::class);

        $professorUser = User::where('email', 'prof@ista.test')->firstOrFail();
        $otherProfessorUser = User::where('email', 'prof2@ista.test')->firstOrFail();

        $professor = $professorUser->professeur;
        $otherProfessor = $otherProfessorUser->professeur;

        $professorTimetable = Timetable::create([
            'title' => 'EDT Professeur DD',
            'image_path' => 'timetables/professeur-dd.png',
            'groupe_id' => $professor->groupes()->firstOrFail()->id,
            'created_by' => $professorUser->id,
        ]);
        $professorTimetable->professeurs()->sync([$professor->id]);

        $otherTimetable = Timetable::create([
            'title' => 'EDT Professeur ID',
            'image_path' => 'timetables/professeur-id.png',
            'groupe_id' => $otherProfessor->groupes()->firstOrFail()->id,
            'created_by' => $otherProfessorUser->id,
        ]);
        $otherTimetable->professeurs()->sync([$otherProfessor->id]);

        Sanctum::actingAs($professorUser);

        $emploiDuTemps = $this->getJson('/api/professeur/emploi-du-temps')
            ->assertOk()
            ->assertJsonStructure([
                'emploi_du_temps' => [
                    '*' => ['id', 'title', 'image_path', 'image_url'],
                ],
            ])
            ->json('emploi_du_temps');

        $this->assertCount(1, $emploiDuTemps);
        $this->assertSame($professorTimetable->id, $emploiDuTemps[0]['id']);
        $this->assertSame('EDT Professeur DD', $emploiDuTemps[0]['title']);
        $this->assertNotSame($otherTimetable->id, $emploiDuTemps[0]['id']);
    }

    public function test_professor_can_download_only_his_assigned_timetable(): void
    {
        $this->seed(DatabaseSeeder::class);

        Storage::fake('public');

        $professorUser = User::where('email', 'prof@ista.test')->firstOrFail();
        $otherProfessorUser = User::where('email', 'prof2@ista.test')->firstOrFail();

        $professor = $professorUser->professeur;
        $otherProfessor = $otherProfessorUser->professeur;

        Storage::disk('public')->put('timetables/professeur-dd.pdf', 'pdf-bytes');
        Storage::disk('public')->put('timetables/professeur-id.pdf', 'pdf-bytes');

        $professorTimetable = Timetable::create([
            'title' => 'EDT Professeur DD',
            'image_path' => 'timetables/professeur-dd.pdf',
            'groupe_id' => $professor->groupes()->firstOrFail()->id,
            'created_by' => $professorUser->id,
        ]);
        $professorTimetable->professeurs()->sync([$professor->id]);

        $otherTimetable = Timetable::create([
            'title' => 'EDT Professeur ID',
            'image_path' => 'timetables/professeur-id.pdf',
            'groupe_id' => $otherProfessor->groupes()->firstOrFail()->id,
            'created_by' => $otherProfessorUser->id,
        ]);
        $otherTimetable->professeurs()->sync([$otherProfessor->id]);

        Sanctum::actingAs($professorUser);

        $response = $this->get("/api/professeur/timetables/{$professorTimetable->id}/download");

        $response->assertOk();
        $this->assertStringContainsString('attachment', $response->headers->get('content-disposition'));
        $this->assertStringContainsString('professeur-dd.pdf', $response->headers->get('content-disposition'));

        $this->get("/api/professeur/timetables/{$otherTimetable->id}/download")
            ->assertForbidden();
    }
}
