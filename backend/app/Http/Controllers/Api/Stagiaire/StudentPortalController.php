<?php

namespace App\Http\Controllers\Api\Stagiaire;

use App\Http\Controllers\Controller;
use App\Models\EmploiDuTemps;
use App\Models\Note;
use App\Models\Notification;
use App\Models\Stagiaire;
use App\Models\Timetable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentPortalController extends Controller
{
    public function notes(Request $request): JsonResponse
    {
        $user = $request->user();
        $stagiaire = Stagiaire::where('user_id', $user->id)->firstOrFail();

        $notesQuery = Note::with('module')
            ->where('stagiaire_id', $stagiaire->id)
            ->orderByDesc('created_at');

        Note::applyWorkflowStatusFilter($notesQuery, Note::STATUS_VALIDATED);

        $notes = $notesQuery->get()->map(function (Note $note) {
            $controle1 = $note->cc1 !== null ? (float) $note->cc1 : null;
            $controle2 = $note->cc2 !== null ? (float) $note->cc2 : null;
            $controle3 = $note->cc3 !== null ? (float) $note->cc3 : null;
            $efm = $note->efm !== null ? (float) $note->efm : null;

            return [
                'id' => $note->id,
                'stagiaire_id' => $note->stagiaire_id,
                'module_id' => $note->module_id,
                'module' => $note->module?->nom ?? 'Module',
                'controle1' => $controle1,
                'controle2' => $controle2,
                'controle3' => $controle3,
                'cc1' => $controle1,
                'cc2' => $controle2,
                'cc3' => $controle3,
                'efm' => $efm,
                'note' => $note->note !== null ? (float) $note->note : null,
                'validation_status' => $note->workflowStatus(),
            ];
        })->values();

        return response()->json([
            'notes' => $notes,
        ]);
    }

    public function emploiDuTemps(Request $request): JsonResponse
    {
        $user = $request->user();
        $stagiaire = Stagiaire::with('groupe.filiere')->where('user_id', $user->id)->firstOrFail();
        $groupe = $stagiaire->groupe;

        $timetable = Timetable::with(['groupes.filiere', 'groupe.filiere'])
            ->where(function ($query) use ($stagiaire) {
                $query
                    ->where('groupe_id', $stagiaire->groupe_id)
                    ->orWhereHas('groupes', fn ($groupQuery) => $groupQuery->where('groupes.id', $stagiaire->groupe_id));
            })
            ->latest()
            ->first();

        return response()->json([
            'group' => $groupe?->nom,
            'filiere' => $groupe?->filiere?->nom,
            'timetable' => $timetable ? [
                'id' => $timetable->id,
                'title' => $timetable->title,
                'image_url' => $timetable->image_url,
                'image_path' => $timetable->image_path,
                'created_at' => optional($timetable->created_at)?->toISOString(),
                'updated_at' => optional($timetable->updated_at)?->toISOString(),
            ] : null,
        ]);
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

        $announcements = Notification::where('user_id', $user->id)
            ->latest()
            ->get();

        return response()->json($announcements);
    }

    public function aiRecommendation(Request $request): JsonResponse
    {
        $user = $request->user();
        $stagiaire = Stagiaire::where('user_id', $user->id)->firstOrFail();

        $averageQuery = Note::query()->where('stagiaire_id', $stagiaire->id);
        Note::applyWorkflowStatusFilter($averageQuery, Note::STATUS_VALIDATED);

        $average = $averageQuery->avg('note');
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
