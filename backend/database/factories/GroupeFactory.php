<?php

namespace Database\Factories;

use App\Models\Filier;
use App\Models\Groupe;
use Illuminate\Database\Eloquent\Factories\Factory;

use Database\Factories\FiliereFactory;

/**
 * @extends Factory<Groupe>
 */
class GroupeFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Groupe::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nom' => $this->faker->randomElement(['G1', 'G2', 'GA', 'GB']),
            'filiere_id' => Filier::factory(),
        ];
    }
}

