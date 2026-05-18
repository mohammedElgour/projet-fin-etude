<?php

namespace Tests\Feature;

use App\Models\Module;
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
            'note' => 14.5,
        ])->assertStatus(403);
    }
}
