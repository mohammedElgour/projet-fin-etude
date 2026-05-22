<?php

namespace Tests\Feature;

use App\Models\Module;
use App\Models\Note;
use App\Models\Stagiaire;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfessorScopeTest extends TestCase
{
    use RefreshDatabase;

    public function test_professor_catalog_is_limited_to_his_filiere(): void
    {
        $this->seed(DatabaseSeeder::class);

        Sanctum::actingAs(User::where('email', 'prof@ista.test')->firstOrFail());

        $response = $this->getJson('/api/professeur/catalog')
            ->assertOk()
            ->json();

        $groupNames = collect($response['groupes'] ?? [])->pluck('nom');
        $moduleFilieres = collect($response['modules'] ?? [])->pluck('filiere.nom');

        $this->assertTrue($groupNames->contains('DD101'));
        $this->assertTrue($groupNames->contains('DD102'));
        $this->assertFalse($groupNames->contains('ID201'));
        $this->assertTrue($moduleFilieres->every(fn ($name) => $name === 'Développement Digital'));
    }

    public function test_professor_cannot_insert_note_outside_his_filiere(): void
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
}
