<?php

namespace Tests\Feature;

use App\Models\Groupe;
use App\Models\Filier;
use App\Models\Notification;
use App\Models\Stagiaire;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected function submitProfessorNotes(): array
    {
        $professorUser = User::where('email', 'prof@ista.test')->firstOrFail();
        $groupe = $professorUser->professeur->groupes()->where('nom', 'DD101')->firstOrFail();
        $module = $professorUser->professeur->modules()
            ->where('code', 'M105')
            ->where('filiere_id', $groupe->filiere_id)
            ->firstOrFail();

        $students = Stagiaire::with(['user', 'groupe'])
            ->where('groupe_id', $groupe->id)
            ->orderBy('id')
            ->get();

        Sanctum::actingAs($professorUser);

        $submissionResponse = $this->postJson('/api/professeur/notes/submit', [
            'groupe_id' => $groupe->id,
            'module_id' => $module->id,
            'notes' => $students->values()->map(function (Stagiaire $student, int $index) {
                return [
                    'stagiaire_id' => $student->id,
                    'controle_1' => 12 + $index,
                    'controle_2' => 13 + $index,
                    'controle_3' => 14 + $index,
                    'efm' => 15 + $index,
                ];
            })->all(),
        ])->assertOk();

        return [
            'professor' => $professorUser,
            'groupe' => $groupe,
            'module' => $module,
            'students' => $students,
            'submission_id' => $submissionResponse->json('submission.id'),
        ];
    }

    public function test_professor_submission_creates_notification_only_for_admin(): void
    {
        $this->seed(DatabaseSeeder::class);

        $admins = User::where('role', 'admin')->get();
        $adminCountsBefore = $admins->mapWithKeys(fn (User $admin) => [
            $admin->id => Notification::where('user_id', $admin->id)->count(),
        ]);

        $workflow = $this->submitProfessorNotes();

        foreach ($admins as $admin) {
            $this->assertSame(
                $adminCountsBefore[$admin->id] + 1,
                Notification::where('user_id', $admin->id)->count()
            );

            $this->assertDatabaseHas('notifications', [
                'user_id' => $admin->id,
                'title' => 'Soumission des notes',
                'message' => 'Les notes ont été soumises et attendent validation',
            ]);
        }

        foreach ($workflow['students'] as $student) {
            $this->assertDatabaseMissing('notifications', [
                'user_id' => $student->user->id,
                'message' => 'Les notes ont ete soumises et attendent validation',
            ]);
        }
    }

    public function test_admin_validation_notifies_only_the_concerned_students_after_validation(): void
    {
        $this->seed(DatabaseSeeder::class);

        $workflow = $this->submitProfessorNotes();
        $outsideStudent = Stagiaire::with('user')
            ->where('groupe_id', '!=', $workflow['groupe']->id)
            ->firstOrFail();

        foreach ($workflow['students'] as $student) {
            $this->assertDatabaseMissing('notifications', [
                'user_id' => $student->user->id,
                'message' => 'Vos notes ont été validées',
            ]);
        }

        Sanctum::actingAs(User::where('email', 'admin@ista.test')->firstOrFail());

        $this->postJson('/api/admin/notes/validate-group', [
            'submission_id' => $workflow['submission_id'],
        ])->assertOk();

        foreach ($workflow['students'] as $student) {
            $this->assertDatabaseHas('notifications', [
                'user_id' => $student->user->id,
                'title' => 'Validation des notes',
                'message' => 'Vos notes ont été validées',
            ]);
        }

        $this->assertDatabaseMissing('notifications', [
            'user_id' => $outsideStudent->user->id,
            'message' => 'Vos notes ont été validées',
        ]);
    }

    public function test_notifications_endpoints_are_scoped_and_mark_as_read_updates_unread_count(): void
    {
        $this->seed(DatabaseSeeder::class);

        $studentUser = User::where('email', 'sara@ista.test')->firstOrFail();
        $otherUser = User::where('email', 'prof@ista.test')->firstOrFail();

        $ownedUnread = Notification::create([
            'user_id' => $studentUser->id,
            'title' => 'Notes',
            'message' => 'Vos notes ont ete validees',
            'is_read' => false,
        ]);

        Notification::create([
            'user_id' => $studentUser->id,
            'title' => 'Information',
            'message' => 'Deuxieme notification',
            'is_read' => true,
        ]);

        $otherNotification = Notification::create([
            'user_id' => $otherUser->id,
            'title' => 'Professeur',
            'message' => 'Notification privee professeur',
            'is_read' => false,
        ]);

        Sanctum::actingAs($studentUser);

        $notificationsPayload = $this->getJson('/api/notifications')
            ->assertOk()
            ->json('data');

        $this->assertNotEmpty($notificationsPayload);
        $this->assertTrue(
            collect($notificationsPayload)->every(
                fn (array $notification) => (int) $notification['user_id'] === (int) $studentUser->id
            )
        );

        $unreadBefore = Notification::where('user_id', $studentUser->id)
            ->where('is_read', false)
            ->count();

        $this->getJson('/api/notifications/unread-count')
            ->assertOk()
            ->assertJsonPath('count', $unreadBefore);

        $this->postJson('/api/notifications/mark-as-read', [
            'notification_id' => $ownedUnread->id,
        ])->assertOk();

        $this->getJson('/api/notifications/unread-count')
            ->assertOk()
            ->assertJsonPath('count', $unreadBefore - 1);

        $this->postJson('/api/notifications/mark-as-read', [
            'notification_id' => $otherNotification->id,
        ])->assertStatus(403);
    }

    public function test_admin_can_send_global_notifications_to_a_selected_user_type(): void
    {
        $this->seed(DatabaseSeeder::class);

        $professorUsers = User::where('role', 'professeur')->get();
        $studentUsers = User::where('role', 'stagiaire')->get();

        Sanctum::actingAs(User::where('email', 'admin@ista.test')->firstOrFail());

        $this->postJson('/api/admin/notifications', [
            'target_type' => 'user_type',
            'user_type' => 'professeur',
            'title' => 'Annonce',
            'message' => 'Reunion pedagogique demain.',
        ])
            ->assertCreated()
            ->assertJsonPath('count', $professorUsers->count());

        foreach ($professorUsers as $professorUser) {
            $this->assertDatabaseHas('notifications', [
                'user_id' => $professorUser->id,
                'title' => 'Annonce',
                'message' => 'Reunion pedagogique demain.',
            ]);
        }

        foreach ($studentUsers as $studentUser) {
            $this->assertDatabaseMissing('notifications', [
                'user_id' => $studentUser->id,
                'title' => 'Annonce',
                'message' => 'Reunion pedagogique demain.',
            ]);
        }
    }

    public function test_admin_manual_notification_cannot_target_admin_user_type(): void
    {
        $this->seed(DatabaseSeeder::class);

        Sanctum::actingAs(User::where('email', 'admin@ista.test')->firstOrFail());

        $this->postJson('/api/admin/notifications', [
            'target_type' => 'user_type',
            'user_type' => 'admin',
            'title' => 'Annonce interne',
            'message' => 'Message reserve aux administrateurs.',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('user_type');
    }

    public function test_admin_notification_validation_returns_structured_json(): void
    {
        $this->seed(DatabaseSeeder::class);

        Sanctum::actingAs(User::where('email', 'admin@ista.test')->firstOrFail());

        $this->postJson('/api/admin/notifications', [
            'target_type' => 'user_type',
            'user_type' => 'professeur',
            'title' => 'Annonce',
        ])
            ->assertUnprocessable()
            ->assertJson([
                'success' => false,
                'message' => 'Validation failed',
            ])
            ->assertJsonValidationErrors('message');
    }

    public function test_admin_notification_returns_no_recipients_found_when_target_has_no_users(): void
    {
        $this->seed(DatabaseSeeder::class);

        $emptyGroup = Groupe::create([
            'nom' => 'EMPTY001',
            'filiere_id' => Filier::firstOrFail()->id,
        ]);

        Sanctum::actingAs(User::where('email', 'admin@ista.test')->firstOrFail());

        $this->postJson('/api/admin/notifications', [
            'target_type' => 'groupes',
            'groupe_ids' => [$emptyGroup->id],
            'title' => 'Annonce',
            'message' => 'Aucun destinataire.',
        ])
            ->assertUnprocessable()
            ->assertJson([
                'success' => false,
                'message' => 'No recipients found',
            ]);
    }

    public function test_admin_can_send_notifications_to_multiple_selected_groupes_only(): void
    {
        $this->seed(DatabaseSeeder::class);

        $targetGroupes = Groupe::query()
            ->whereIn('nom', ['DD101', 'DD102'])
            ->get();

        $targetStudents = Stagiaire::with('user')
            ->whereIn('groupe_id', $targetGroupes->pluck('id'))
            ->get();

        $outsideStudent = Stagiaire::with('user')
            ->whereHas('groupe', fn ($query) => $query->where('nom', 'ID201'))
            ->firstOrFail();

        Sanctum::actingAs(User::where('email', 'admin@ista.test')->firstOrFail());

        $this->postJson('/api/admin/notifications', [
            'target_type' => 'groupes',
            'groupe_ids' => $targetGroupes->pluck('id')->all(),
            'message' => 'Message reserve aux groupes DD.',
        ])
            ->assertCreated()
            ->assertJsonPath('count', $targetStudents->count());

        foreach ($targetStudents as $student) {
            $this->assertDatabaseHas('notifications', [
                'user_id' => $student->user->id,
                'message' => 'Message reserve aux groupes DD.',
            ]);
        }

        $this->assertDatabaseMissing('notifications', [
            'user_id' => $outsideStudent->user->id,
            'message' => 'Message reserve aux groupes DD.',
        ]);

        $this->assertDatabaseMissing('notifications', [
            'user_id' => User::where('email', 'prof@ista.test')->firstOrFail()->id,
            'message' => 'Message reserve aux groupes DD.',
        ]);
    }

    public function test_admin_can_send_notifications_to_selected_stagiaires_and_professeurs(): void
    {
        $this->seed(DatabaseSeeder::class);

        $student = Stagiaire::with('user')
            ->whereRelation('user', 'email', 'sara@ista.test')
            ->firstOrFail();
        $outsideStudent = Stagiaire::with('user')
            ->whereRelation('user', 'email', 'youssef@ista.test')
            ->firstOrFail();
        $professor = User::where('email', 'prof@ista.test')->firstOrFail()->professeur;
        $outsideProfessor = User::where('email', 'prof2@ista.test')->firstOrFail()->professeur;

        Sanctum::actingAs(User::where('email', 'admin@ista.test')->firstOrFail());

        $this->postJson('/api/admin/notifications', [
            'target_type' => 'stagiaires',
            'stagiaire_ids' => [$student->id],
            'title' => 'Info stagiaire',
            'message' => 'Message individuel stagiaire.',
        ])
            ->assertCreated()
            ->assertJsonPath('count', 1);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $student->user->id,
            'title' => 'Info stagiaire',
            'message' => 'Message individuel stagiaire.',
        ]);

        $this->assertDatabaseMissing('notifications', [
            'user_id' => $outsideStudent->user->id,
            'message' => 'Message individuel stagiaire.',
        ]);

        $this->postJson('/api/admin/notifications', [
            'target_type' => 'professeurs',
            'professeur_ids' => [$professor->id],
            'title' => 'Info professeur',
            'message' => 'Message individuel professeur.',
        ])
            ->assertCreated()
            ->assertJsonPath('count', 1);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $professor->user->id,
            'title' => 'Info professeur',
            'message' => 'Message individuel professeur.',
        ]);

        $this->assertDatabaseMissing('notifications', [
            'user_id' => $outsideProfessor->user->id,
            'message' => 'Message individuel professeur.',
        ]);
    }
}
