<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationManagementController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:1000'],
            'type' => ['required', 'in:info,warning,success,error'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'role' => ['nullable', 'in:admin,professeur,stagiaire'],
        ]);

        if (empty($validated['user_id']) && empty($validated['role'])) {
            return response()->json([
                'message' => 'Veuillez cibler un utilisateur ou un role.',
            ], 422);
        }

        $users = User::query()
            ->when(!empty($validated['user_id']), fn ($query) => $query->whereKey($validated['user_id']))
            ->when(!empty($validated['role']), fn ($query) => $query->where('role', $validated['role']))
            ->get();

        $notifications = $users->map(function (User $user) use ($validated) {
            return Notification::create([
                'user_id' => $user->id,
                'title' => $validated['title'],
                'type' => $validated['type'],
                'role' => $validated['role'] ?? $user->role,
                'message' => $validated['message'],
                'is_read' => false,
                'read_at' => null,
            ]);
        });

        return response()->json([
            'message' => 'Notification envoyee avec succes.',
            'count' => $notifications->count(),
            'notifications' => $notifications,
        ], 201);
    }
}
