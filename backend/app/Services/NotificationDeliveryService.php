<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Professeur;
use App\Models\Stagiaire;
use App\Models\User;
use InvalidArgumentException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class NotificationDeliveryService
{
    private const MANUAL_USER_TYPES = ['stagiaire', 'professeur'];

    public function sendToUsers(iterable $users, ?string $title, string $message): int
    {
        $recipients = $this->normalizeUsers($users);

        if ($recipients->isEmpty()) {
            Log::warning('Notification send skipped because no recipients were resolved.', [
                'title' => $title,
            ]);

            return 0;
        }

        try {
            DB::transaction(function () use ($recipients, $title, $message) {
                foreach ($recipients as $recipient) {
                    Notification::create([
                        'user_id' => $recipient->id,
                        'title' => $title,
                        'message' => $message,
                        'is_read' => false,
                    ]);
                }
            });

            return $recipients->count();
        } catch (Throwable $exception) {
            Log::error('Failed to create notifications.', [
                'recipient_user_ids' => $recipients->pluck('id')->all(),
                'title' => $title,
                'message' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
                'trace' => $exception->getTraceAsString(),
            ]);

            throw $exception;
        }
    }

    public function sendToUserType(string $userType, ?string $title, string $message): int
    {
        if (!in_array($userType, self::MANUAL_USER_TYPES, true)) {
            throw new InvalidArgumentException('Unsupported notification user type.');
        }

        return $this->sendToUsers(
            User::query()->where('role', $userType)->get(),
            $title,
            $message
        );
    }

    public function sendToStagiaires(array $stagiaireIds, ?string $title, string $message): int
    {
        $users = Stagiaire::query()
            ->with('user')
            ->whereIn('id', $stagiaireIds)
            ->get()
            ->pluck('user');

        return $this->sendToUsers($users, $title, $message);
    }

    public function sendToProfesseurs(array $professeurIds, ?string $title, string $message): int
    {
        $users = Professeur::query()
            ->with('user')
            ->whereIn('id', $professeurIds)
            ->get()
            ->pluck('user');

        return $this->sendToUsers($users, $title, $message);
    }

    public function sendToGroups(array $groupeIds, ?string $title, string $message): int
    {
        $users = Stagiaire::query()
            ->with('user')
            ->whereIn('groupe_id', $groupeIds)
            ->get()
            ->pluck('user');

        return $this->sendToUsers($users, $title, $message);
    }

    private function normalizeUsers(iterable $users): Collection
    {
        return collect($users)
            ->filter(fn ($user) => $user instanceof User)
            ->unique('id')
            ->values();
    }
}
