<?php

namespace Database\Factories;

use App\Models\Filier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Filier>
 */
class FilierFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Filier::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nom' => $this->faker->randomElement(['Développement Web', 'Réseaux et Télécom', 'Systèmes et Réseaux', 'Développement Mobile']),
            'description' => $this->faker->sentence(),
        ];
    }
}
