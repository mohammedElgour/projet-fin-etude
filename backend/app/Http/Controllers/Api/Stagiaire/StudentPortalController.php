<?php

namespace App\Http\Controllers\Api\Stagiaire;

use App\Http\Controllers\Controller;
use App\Models\EmploiDuTemps;
use App\Models\Note;
use App\Models\Notification;
use App\Models\Stagiaire;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentPortalController extends Controller
{
    public function notes(Request $request): JsonResponse
    {
        $user = $request->user();
        $stagiaire = Stagiaire::where('user_id', $user->id)->firstOrFail();

        $notes = Note::with('module')
            ->where('stagiaire_id', $stagiaire->id)
            ->where('validation_status', 'validated')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($notes);
    }

    public function schedule(Request $request): JsonResponse
    {
        $user = $request->user();
        $stagiaire = Stagiaire::with('groupe')->where('user_id', $user->id)->firstOrFail();

        $schedules = EmploiDuTemps::where('groupe_id', $stagiaire->groupe_id)
            ->orderByDesc('date')
            ->get();

        return response()->json($schedules);
    }

    public function announcements(Request $request): JsonResponse
    {
        $user = $request->user();

        $announcements = Notification::query()
            ->where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->orWhere('role', 'stagiaire');
            })
            ->latest()
            ->get();

        return response()->json($announcements);
    }

    public function aiRecommendation(Request $request): JsonResponse
    {
        $user = $request->user();
        $stagiaire = Stagiaire::where('user_id', $user->id)->firstOrFail();

        $average = Note::where('stagiaire_id', $stagiaire->id)
            ->where('validation_status', 'validated')
            ->avg('note');
        $average = $average ? round((float) $average, 2) : 0.0;

        $status = $average >= 14 ? 'good_performance' : 'needs_improvement';
        $message = $average >= 14
            ? 'Tres bon travail, continuez ainsi.'
            : 'Vous pouvez ameliorer vos resultats avec plus de revision ciblee.';

        return response()->json([
            'average' => $average,
            'status' => $status,
            'recommendation' => $message,
        ]);
    }
}
