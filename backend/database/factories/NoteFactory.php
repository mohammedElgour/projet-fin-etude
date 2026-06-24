<?php

namespace Database\Factories;

use App\Models\Module;
use App\Models\Note;
use App\Models\NoteSubmission;
use App\Models\Professeur;
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
        $status = $this->faker->randomElement(['draft', 'submitted', 'validated', 'rejected']);
        $cc1 = $this->faker->randomFloat(2, 0, 20);
        $cc2 = $this->faker->randomFloat(2, 0, 20);
        $cc3 = $this->faker->randomFloat(2, 0, 20);
        $efm = $this->faker->randomFloat(2, 0, 40);
        $average = round((($cc1 + $cc2 + $cc3 + $efm) / 5), 2);

        return Note::prepareWorkflowAttributes([
            'submission_id' => function (array $attributes) {
                $teacher = Professeur::query()->first() ?? Professeur::factory()->create();
                $student = Stagiaire::query()->find($attributes['stagiaire_id']);

                return NoteSubmission::query()->firstOrCreate(
                    [
                        'groupe_id' => $student?->groupe_id,
                        'module_id' => $attributes['module_id'],
                    ],
                    [
                        'teacher_id' => $teacher->id,
                        'status' => NoteSubmission::STATUS_PENDING,
                        'submitted_at' => now(),
                    ]
                )->id;
            },
            'stagiaire_id' => Stagiaire::factory(),
            'module_id' => Module::factory(),
            'cc1' => $cc1,
            'cc2' => $cc2,
            'cc3' => $cc3,
            'efm' => $efm,
            'note' => $average,
            'status' => $status,
            'feedback' => $status === 'rejected' ? 'Veuillez verifier cette note.' : null,
            'reviewed_at' => in_array($status, ['validated', 'rejected'], true) ? now() : null,
        ]);
    }
}
