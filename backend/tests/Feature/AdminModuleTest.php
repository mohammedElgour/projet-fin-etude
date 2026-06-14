<?php

namespace Tests\Feature;

use App\Models\Filier;
use App\Models\Module;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_module_and_see_it_immediately_in_index(): void
    {
        $this->seed(DatabaseSeeder::class);

        $admin = User::where('role', 'admin')->firstOrFail();
        $filiere = Filier::where('nom', "D\u{00E9}veloppement Digital")->firstOrFail();
        $code = 'MX999';

        Sanctum::actingAs($admin);

        $createResponse = $this->postJson('/api/admin/modules', [
            'code' => $code,
            'nom' => 'Module de test',
            'coefficient' => 2.5,
            'filiere_id' => $filiere->id,
        ]);

        $createResponse->assertCreated()
            ->assertJsonFragment(['code' => $code]);

        $this->assertDatabaseHas('modules', [
            'code' => $code,
            'filiere_id' => $filiere->id,
        ]);

        $indexResponse = $this->getJson('/api/admin/modules');

        $indexResponse->assertOk()
            ->assertJsonPath('data.0.code', $code);

        $this->assertTrue(
            Module::query()
                ->where('code', $code)
                ->exists()
        );
    }
}
