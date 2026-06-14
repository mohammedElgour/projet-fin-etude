<?php

namespace Tests\Feature;

use App\Models\Filier;
use App\Models\Groupe;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminGroupeTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_groupe_and_see_it_immediately_in_index(): void
    {
        $this->seed(DatabaseSeeder::class);

        $admin = User::where('role', 'admin')->firstOrFail();
        $filiere = Filier::where('nom', "D\u{00E9}veloppement Digital")->firstOrFail();
        $nom = 'DD999';

        Sanctum::actingAs($admin);

        $createResponse = $this->postJson('/api/admin/groupes', [
            'nom' => $nom,
            'filiere_id' => $filiere->id,
        ]);

        $createResponse->assertCreated()
            ->assertJsonFragment(['nom' => $nom]);

        $this->assertDatabaseHas('groupes', [
            'nom' => $nom,
            'filiere_id' => $filiere->id,
        ]);

        $indexResponse = $this->getJson('/api/admin/groupes');

        $indexResponse->assertOk()
            ->assertJsonPath('data.0.nom', $nom);

        $this->assertTrue(
            Groupe::query()
                ->where('nom', $nom)
                ->exists()
        );
    }
}
