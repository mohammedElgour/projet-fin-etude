<?php

namespace Database\Factories;

use App\Models\Module;
use App\Models\Note;
use App\Models\Stagiaire;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Note>
 */
class NoteFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Note::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $status = $this->faker->randomElement(['pending', 'validated', 'rejected']);

        return [
            'stagiaire_id' => Stagiaire::factory(),
            'module_id' => Module::factory(),
            'note' => $this->faker->randomFloat(2, 0, 20),
            'is_validated' => $status === 'validated',
            'validation_status' => $status,
            'feedback' => $status === 'rejected' ? 'Veuillez verifier cette note.' : null,
            'reviewed_at' => $status === 'pending' ? null : now(),
        ];
    }
}
