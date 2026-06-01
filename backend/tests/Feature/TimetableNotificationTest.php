<?php

namespace Tests\Feature;

use App\Models\Groupe;
use App\Models\Notification;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TimetableNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_group_timetable_creation_notifies_group_students_and_related_professors(): void
    {
        $this->seed(DatabaseSeeder::class);

        Notification::query()->delete();
        Storage::fake('public');

        $admin = User::where('email', 'admin@ista.test')->firstOrFail();
        $groupe = Groupe::with(['stagiaires.user', 'professeurs.user'])
            ->where('nom', 'DD101')
            ->firstOrFail();

        $expectedRecipients = $groupe->stagiaires
            ->map(fn ($stagiaire) => $stagiaire->user)
            ->merge($groupe->professeurs->map(fn ($professeur) => $professeur->user))
            ->filter()
            ->unique('id')
            ->values();

        Sanctum::actingAs($admin);

        $this->withHeader('Accept', 'application/json')
            ->post('/api/admin/timetables', [
                'title' => 'Planning DD101',
                'image' => UploadedFile::fake()->image('planning-dd101.png'),
                'groupe_id' => $groupe->id,
            ])
            ->assertCreated();

        $this->assertCount($expectedRecipients->count(), Notification::all());

        foreach ($expectedRecipients as $recipient) {
            $this->assertDatabaseHas('notifications', [
                'user_id' => $recipient->id,
                'title' => 'Emploi du temps',
                'message' => 'Votre emploi du temps a été mis à jour',
            ]);
        }

        $this->assertDatabaseMissing('notifications', [
            'user_id' => User::where('email', 'salma@ista.test')->firstOrFail()->id,
            'title' => 'Emploi du temps',
            'message' => 'Votre emploi du temps a été mis à jour',
        ]);

        $this->assertDatabaseMissing('notifications', [
            'user_id' => User::where('email', 'prof2@ista.test')->firstOrFail()->id,
            'title' => 'Emploi du temps',
            'message' => 'Votre emploi du temps a été mis à jour',
        ]);
    }

    public function test_professor_timetable_creation_notifies_only_the_assigned_professor(): void
    {
        $this->seed(DatabaseSeeder::class);

        Notification::query()->delete();
        Storage::fake('public');

        $admin = User::where('email', 'admin@ista.test')->firstOrFail();
        $professorUser = User::where('email', 'prof@ista.test')->firstOrFail();

        Sanctum::actingAs($admin);

        $this->withHeader('Accept', 'application/json')
            ->post('/api/admin/timetables', [
                'title' => 'Planning professeur',
                'image' => UploadedFile::fake()->image('planning-prof.png'),
                'professeur_id' => $professorUser->professeur->id,
            ])
            ->assertCreated();

        $this->assertCount(1, Notification::all());

        $this->assertDatabaseHas('notifications', [
            'user_id' => $professorUser->id,
            'title' => 'Emploi du temps',
            'message' => 'Votre emploi du temps a été mis à jour',
        ]);

        $this->assertDatabaseMissing('notifications', [
            'user_id' => User::where('email', 'sara@ista.test')->firstOrFail()->id,
            'title' => 'Emploi du temps',
            'message' => 'Votre emploi du temps a été mis à jour',
        ]);
    }
}
