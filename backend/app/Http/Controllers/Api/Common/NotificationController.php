<?php

namespace App\Http\Controllers\Api\Common;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Common\StoreNotificationRequest;
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

    public function store(StoreNotificationRequest $request): JsonResponse
    {
        Log::info('Notification request received', [
            'payload' => $request->all(),
            'user' => $request->user()?->id,
        ]);

        $validated = $request->validated();

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
                'message' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
                'trace' => $exception->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Unable to send notifications at the moment.',
            ], 500);
        }

        if ($count === 0) {
            return response()->json([
                'success' => false,
                'message' => 'No recipients found',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Notifications sent successfully.',
            'count' => $count,
        ], 201);
    }

    private function integerIds(array $ids): array
    {
        return array_values(array_unique(array_map('intval', $ids)));
    }
}
