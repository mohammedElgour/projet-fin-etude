<?php

namespace Database\Factories;

use App\Models\EmploiDuTemps;
use App\Models\Groupe;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EmploiDuTemps>
 */
class EmploiDuTempsFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = EmploiDuTemps::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'groupe_id' => Groupe::factory(),
            'fichier' => $this->faker->randomElement([json_encode(['lundi' => 'Maths', 'mardi' => 'Info']), json_encode(['mercredi' => 'Réseaux'])]),
            'date' => $this->faker->dateTimeThisYear(),
        ];
    }
}

