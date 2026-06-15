<?php

namespace App\Http\Controllers\Api\Stagiaire;

use App\Http\Controllers\Controller;
use App\Models\EmploiDuTemps;
use App\Models\Module;
use App\Models\Note;
use App\Models\Notification;
use App\Models\Stagiaire;
use App\Models\Timetable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class StudentPortalController extends Controller
{
    private const TRANSCRIPT_BLOCKED_MESSAGE = 'Le relevé de notes est disponible uniquement après validation de tous les modules.';

    private function resolveStagiaire(Request $request): Stagiaire
    {
        $user = $request->user();

        return Stagiaire::with(['groupe.filiere.modules', 'notes.module', 'notes.submission'])
            ->where('user_id', $user->id)
            ->firstOrFail();
    }

    private function resolveNoteWorkflowStatus(Note $note): string
    {
        $noteStatus = $note->workflowStatus();

        if (in_array($noteStatus, [Note::STATUS_APPROVED, Note::STATUS_REJECTED], true)) {
            return $noteStatus;
        }

        $submissionStatus = $note->submission?->workflowStatus();

        if (in_array($submissionStatus, [Note::STATUS_APPROVED, Note::STATUS_REJECTED], true)) {
            return $submissionStatus;
        }

        return $noteStatus;
    }

    private function resolveFinalGrade(Note $note, string $status): ?float
    {
        if ($status !== Note::STATUS_APPROVED) {
            return null;
        }

        $components = collect([$note->cc1, $note->cc2, $note->cc3, $note->efm])
            ->map(fn ($value) => is_numeric($value) ? (float) $value : null);

        if ($components->every(fn ($value) => $value !== null)) {
            return round($components->sum() / 5, 2);
        }

        return $note->finalAverage() ?? ($note->note !== null ? (float) $note->note : null);
    }

    private function buildValidatedNotes(Stagiaire $stagiaire): Collection
    {
        $modules = $stagiaire->groupe?->filiere?->modules
            ?->sortBy(fn (Module $module) => mb_strtolower($module->nom ?? ''))
            ?? collect();

        $latestNotesByModule = $stagiaire->notes
            ->sortByDesc(fn (Note $note) => optional($note->updated_at ?? $note->created_at)?->getTimestamp() ?? 0)
            ->unique('module_id')
            ->keyBy('module_id');

        return $modules->map(function (Module $module) use ($latestNotesByModule, $stagiaire) {
            $note = $latestNotesByModule->get($module->id);
            $status = $note ? $this->resolveNoteWorkflowStatus($note) : Note::STATUS_DRAFT;
            $finalAverage = $note ? $this->resolveFinalGrade($note, $status) : null;
            $showGrades = $note !== null && $status === Note::STATUS_APPROVED;

            return [
                'id' => $note ? 'note-'.$note->id : 'module-'.$module->id,
                'stagiaire_id' => $stagiaire->id,
                'module_id' => $module->id,
                'module' => [
                    'id' => $module->id,
                    'nom' => $module->nom,
                    'code' => $module->code,
                    'coefficient' => $module->coefficient !== null ? (float) $module->coefficient : null,
                ],
                'module_name' => $module->nom,
                'controle1' => $showGrades && $note->cc1 !== null ? (float) $note->cc1 : null,
                'controle2' => $showGrades && $note->cc2 !== null ? (float) $note->cc2 : null,
                'controle3' => $showGrades && $note->cc3 !== null ? (float) $note->cc3 : null,
                'cc1' => $showGrades && $note->cc1 !== null ? (float) $note->cc1 : null,
                'cc2' => $showGrades && $note->cc2 !== null ? (float) $note->cc2 : null,
                'cc3' => $showGrades && $note->cc3 !== null ? (float) $note->cc3 : null,
                'efm' => $showGrades && $note->efm !== null ? (float) $note->efm : null,
                'controle1_status' => $note?->componentStatus('cc1') ?? Note::STATUS_DRAFT,
                'controle2_status' => $note?->componentStatus('cc2') ?? Note::STATUS_DRAFT,
                'controle3_status' => $note?->componentStatus('cc3') ?? Note::STATUS_DRAFT,
                'efm_status' => $note?->componentStatus('efm') ?? Note::STATUS_DRAFT,
                'status' => $status,
                'validation_status' => $status,
                'submission_status' => $note?->submission?->workflowStatus(),
                'submission_approved_at' => optional($note?->submission?->approved_at)?->toISOString(),
                'submission_rejected_at' => optional($note?->submission?->rejected_at)?->toISOString(),
                'note' => $finalAverage,
                'moyenne' => $finalAverage,
                'passed' => $finalAverage !== null && $finalAverage >= 10,
                'has_note' => $note !== null,
                'created_at' => optional($note?->created_at)?->toISOString(),
                'updated_at' => optional($note?->updated_at)?->toISOString(),
            ];
        })->values();
    }

    private function buildTranscriptStats(Stagiaire $stagiaire, Collection $notes): array
    {
        $totalModulesCount = (int) ($stagiaire->groupe?->filiere?->modules()->count() ?? 0);
        $validatedModulesCount = (int) $notes->filter(
            fn (array $note) => ($note['status'] ?? Note::STATUS_DRAFT) === Note::STATUS_APPROVED
        )->count();
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

        if (app()->hasDebugModeEnabled()) {
            Log::debug('Student portal notes payload prepared', [
                'user_id' => $request->user()?->id,
                'stagiaire_id' => $stagiaire->id,
                'modules_total' => $stats['total_modules_count'],
                'modules_validated' => $stats['validated_modules_count'],
                'modules_pending' => $stats['non_validated_modules_count'],
                'notes_preview' => $notes->take(3)->map(fn (array $note) => [
                    'module_id' => $note['module_id'] ?? null,
                    'status' => $note['status'] ?? null,
                    'submission_status' => $note['submission_status'] ?? null,
                    'final_grade' => $note['note'] ?? null,
                ])->all(),
            ]);
        }

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
            if (app()->hasDebugModeEnabled()) {
                Log::debug('Transcript blocked because not all modules are validated yet.', [
                    'user_id' => $user?->id,
                    'stagiaire_id' => $stagiaire->id,
                    'validated_modules_count' => $stats['validated_modules_count'],
                    'total_modules_count' => $stats['total_modules_count'],
                ]);
            }

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
        $stagiaire = Stagiaire::with(['notes.submission'])->where('user_id', $user->id)->firstOrFail();

        $validatedNotes = $this->buildValidatedNotes($stagiaire)
            ->filter(fn (array $note) => ($note['status'] ?? Note::STATUS_DRAFT) === Note::STATUS_APPROVED);

        $average = $validatedNotes->pluck('note')
            ->filter(fn ($value) => $value !== null)
            ->map(fn ($value) => (float) $value)
            ->avg();
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
