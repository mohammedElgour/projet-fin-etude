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
use Illuminate\Support\Collection;

class StudentPortalController extends Controller
{
    private const TRANSCRIPT_BLOCKED_MESSAGE = 'Le relevé de notes est disponible uniquement après validation de tous les modules.';

    private function resolveStagiaire(Request $request): Stagiaire
    {
        $user = $request->user();

        return Stagiaire::with('groupe.filiere')->where('user_id', $user->id)->firstOrFail();
    }

    private function buildValidatedNotes(Stagiaire $stagiaire): Collection
    {
        $notesQuery = Note::with('module')
            ->where('stagiaire_id', $stagiaire->id)
            ->orderByDesc('created_at');

        Note::applyWorkflowStatusFilter($notesQuery, Note::STATUS_VALIDATED);

        return $notesQuery->get()->map(function (Note $note) {
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
    }

    private function buildTranscriptStats(Stagiaire $stagiaire, Collection $notes): array
    {
        $totalModulesCount = (int) ($stagiaire->groupe?->filiere?->modules()->count() ?? 0);
        $validatedModulesCount = (int) $notes->pluck('module_id')->unique()->count();
        $nonValidatedModulesCount = max($totalModulesCount - $validatedModulesCount, 0);

        $finalGrades = $notes
            ->pluck('note')
            ->filter(fn ($value) => $value !== null)
            ->map(fn ($value) => (float) $value);

        $average = $finalGrades->count()
            ? round((float) $finalGrades->avg(), 2)
            : 0.0;

        return [
            'total_modules_count' => $totalModulesCount,
            'validated_modules_count' => $validatedModulesCount,
            'non_validated_modules_count' => $nonValidatedModulesCount,
            'average' => $average,
            'mention' => $this->resolveMention($average),
            'transcript_available' => $totalModulesCount > 0 && $validatedModulesCount === $totalModulesCount,
        ];
    }

    private function resolveAcademicYear(): string
    {
        $currentYear = (int) now()->year;

        return sprintf('%d-%d', $currentYear - 1, $currentYear);
    }

    private function resolveMention(float $average): string
    {
        if ($average >= 16) {
            return 'Excellent';
        }

        if ($average >= 14) {
            return 'Très Bien';
        }

        if ($average >= 12) {
            return 'Bien';
        }

        if ($average >= 10) {
            return 'Assez Bien';
        }

        return 'Passable';
    }

    public function notes(Request $request): JsonResponse
    {
        $stagiaire = $this->resolveStagiaire($request);
        $notes = $this->buildValidatedNotes($stagiaire);
        $stats = $this->buildTranscriptStats($stagiaire, $notes);

        return response()->json([
            'notes' => $notes,
            'validated_modules_count' => $stats['validated_modules_count'],
            'total_modules_count' => $stats['total_modules_count'],
            'non_validated_modules_count' => $stats['non_validated_modules_count'],
            'transcript_available' => $stats['transcript_available'],
        ]);
    }

    public function transcript(Request $request): JsonResponse
    {
        $user = $request->user();
        $stagiaire = $this->resolveStagiaire($request);
        $notes = $this->buildValidatedNotes($stagiaire);
        $stats = $this->buildTranscriptStats($stagiaire, $notes);

        if (! $stats['transcript_available']) {
            return response()->json([
                'success' => false,
                'message' => self::TRANSCRIPT_BLOCKED_MESSAGE,
            ], 422);
        }

        return response()->json([
            'success' => true,
            'student' => [
                'id' => $stagiaire->id,
                'code' => 'STG-'.$stagiaire->id,
                'name' => $user->name,
                'group' => $stagiaire->groupe?->nom ?? '-',
                'filiere' => $stagiaire->groupe?->filiere?->nom ?? '-',
                'academicYear' => $this->resolveAcademicYear(),
                'email' => $user->email,
                'phone' => $user->phone,
                'address' => $user->address,
            ],
            'notes' => $notes,
            'validated_modules_count' => $stats['validated_modules_count'],
            'total_modules_count' => $stats['total_modules_count'],
            'non_validated_modules_count' => $stats['non_validated_modules_count'],
            'average' => $stats['average'],
            'mention' => $stats['mention'],
            'generated_at' => now()->toISOString(),
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
