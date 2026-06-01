<?php

namespace App\Http\Controllers\Api\Common;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Services\NotificationDeliveryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class NotificationController extends Controller
{
    public function __construct(private NotificationDeliveryService $notifications)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $notifications = Notification::where('user_id', $request->user()->id)
            ->latest()
            ->paginate(20);

        return response()->json($notifications);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        return response()->json([
            'count' => Notification::where('user_id', $request->user()->id)
                ->where('is_read', false)
                ->count(),
        ]);
    }

    protected function markOwnedNotificationAsRead(Notification $notification, int $userId): JsonResponse
    {
        if ($notification->user_id !== $userId) {
            return response()->json(['message' => 'Unauthorized access to notification.'], 403);
        }

        $notification->update(['is_read' => true]);

        return response()->json([
            'message' => 'Notification marked as read.',
            'notification' => $notification->fresh(),
        ]);
    }

    public function markAsRead(Request $request, Notification $notification): JsonResponse
    {
        return $this->markOwnedNotificationAsRead($notification, (int) $request->user()->id);
    }

    public function markAsReadByPayload(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'notification_id' => ['required', 'integer', 'exists:notifications,id'],
        ]);

        $notification = Notification::query()->findOrFail($validated['notification_id']);

        return $this->markOwnedNotificationAsRead($notification, (int) $request->user()->id);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        Notification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json([
            'message' => 'All notifications marked as read.',
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'target_type' => ['required', 'in:stagiaires,professeurs,groupes,user_type'],
            'stagiaire_ids' => ['required_if:target_type,stagiaires', 'array', 'min:1'],
            'stagiaire_ids.*' => ['integer', 'exists:stagiaires,id'],
            'professeur_ids' => ['required_if:target_type,professeurs', 'array', 'min:1'],
            'professeur_ids.*' => ['integer', 'exists:professeurs,id'],
            'groupe_ids' => ['required_if:target_type,groupes', 'array', 'min:1'],
            'groupe_ids.*' => ['integer', 'exists:groupes,id'],
            'user_type' => ['required_if:target_type,user_type', 'in:stagiaire,professeur'],
            'title' => ['nullable', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:2000'],
        ]);

        try {
            $count = match ($validated['target_type']) {
                'stagiaires' => $this->notifications->sendToStagiaires(
                    $this->integerIds($validated['stagiaire_ids'] ?? []),
                    $validated['title'] ?? null,
                    $validated['message']
                ),
                'professeurs' => $this->notifications->sendToProfesseurs(
                    $this->integerIds($validated['professeur_ids'] ?? []),
                    $validated['title'] ?? null,
                    $validated['message']
                ),
                'groupes' => $this->notifications->sendToGroups(
                    $this->integerIds($validated['groupe_ids'] ?? []),
                    $validated['title'] ?? null,
                    $validated['message']
                ),
                'user_type' => $this->notifications->sendToUserType(
                    $validated['user_type'],
                    $validated['title'] ?? null,
                    $validated['message']
                ),
            };
        } catch (Throwable $exception) {
            Log::error('Admin notification send failed.', [
                'admin_user_id' => $request->user()?->id,
                'target_type' => $validated['target_type'],
                'exception' => $exception,
            ]);

            return response()->json([
                'message' => 'Unable to send notifications at the moment.',
            ], 500);
        }

        return response()->json([
            'message' => 'Notifications sent successfully.',
            'count' => $count,
        ], 201);
    }

    private function integerIds(array $ids): array
    {
        return array_values(array_unique(array_map('intval', $ids)));
    }
}
