<?php

namespace Tests\Feature;

use App\Models\Filier;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminFiliereTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_filiere_and_see_it_at_the_top_of_the_list(): void
    {
        $this->seed(DatabaseSeeder::class);

        $admin = User::where('role', 'admin')->firstOrFail();
        $nom = 'Cyberscurite Offensive';

        Sanctum::actingAs($admin);

        $createResponse = $this->postJson('/api/admin/filieres', [
            'nom' => $nom,
            'description' => 'Filiere de test pour verifier la creation.',
        ]);

        $createResponse->assertCreated()
            ->assertJsonPath('nom', $nom);

        $this->assertDatabaseHas('filiers', [
            'nom' => $nom,
        ]);

        $indexResponse = $this->getJson('/api/admin/filieres');

        $indexResponse->assertOk()
            ->assertJsonPath('data.0.nom', $nom);

        $this->assertTrue(
            Filier::query()
                ->where('nom', $nom)
                ->exists()
        );
    }
}
