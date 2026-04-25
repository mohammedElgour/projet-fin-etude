<?php

namespace Database\Factories;

use App\Models\Groupe;
use App\Models\Stagiaire;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Stagiaire>
 */
class StagiaireFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Stagiaire::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->create(['role' => 'stagiaire'])->id,
            'groupe_id' => Groupe::factory(),
        ];
    }
}

