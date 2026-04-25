<?php

namespace Database\Factories;

use App\Models\Filier;
use App\Models\Module;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Module>
 */
class ModuleFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Module::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nom' => $this->faker->randomElement(['Programmation Web', 'Bases de Données', 'Réseaux', 'Systèmes d\'Exploitation', 'Développement Backend', 'Frontend JS']),
            'coefficient' => $this->faker->randomFloat(2, 1, 5),
            'filiere_id' => Filier::factory(),
        ];
    }
}

