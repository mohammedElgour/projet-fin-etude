<?php

namespace Tests\Feature;

use App\Models\Groupe;
use App\Models\Stagiaire;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminStagiaireTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_stagiaire_and_find_it_immediately_in_index(): void
    {
        $this->seed(DatabaseSeeder::class);

        $admin = User::where('role', 'admin')->firstOrFail();
        $groupe = Groupe::where('nom', 'DD101')->firstOrFail();
        $email = 'new.stagiaire@ista.test';

        Sanctum::actingAs($admin);

        $createResponse = $this->postJson('/api/admin/stagiaires', [
            'first_name' => 'Noura',
            'last_name' => 'Alaoui',
            'email' => $email,
            'phone' => '+212 6 11 22 33 44',
            'address' => 'Casablanca',
            'date_of_birth' => '2003-08-17',
            'password' => 'password123',
            'groupe_id' => $groupe->id,
        ]);

        $createResponse->assertCreated()
            ->assertJsonPath('user.email', $email)
            ->assertJsonPath('groupe_id', $groupe->id);

        $this->assertDatabaseHas('users', [
            'email' => $email,
            'role' => 'stagiaire',
        ]);

        $this->assertDatabaseHas('stagiaires', [
            'groupe_id' => $groupe->id,
        ]);

        $indexResponse = $this->getJson('/api/admin/stagiaires');

        $indexResponse->assertOk()
            ->assertJsonPath('data.0.user.email', $email);

        $this->assertTrue(
            Stagiaire::query()
                ->whereHas('user', fn ($query) => $query->where('email', $email))
                ->exists()
        );
    }
}
