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
        $cc1 = $this->faker->randomFloat(2, 0, 20);
        $cc2 = $this->faker->randomFloat(2, 0, 20);
        $cc3 = $this->faker->randomFloat(2, 0, 20);
        $efm = $this->faker->randomFloat(2, 0, 20);
        $average = round((($cc1 + $cc2 + $cc3 + ($efm * 2)) / 5), 2);

        return [
            'stagiaire_id' => Stagiaire::factory(),
            'module_id' => Module::factory(),
            'cc1' => $cc1,
            'cc2' => $cc2,
            'cc3' => $cc3,
            'efm' => $efm,
            'note' => $average,
            'is_validated' => $status === 'validated',
            'validation_status' => $status,
            'feedback' => $status === 'rejected' ? 'Veuillez verifier cette note.' : null,
            'reviewed_at' => $status === 'pending' ? null : now(),
        ];
    }
}
