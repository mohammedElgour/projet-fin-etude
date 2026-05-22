<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Admin\GroupNoteActionRequest;
use App\Http\Requests\Api\Admin\UpdateManagedNoteRequest;
use App\Http\Resources\Admin\NoteSubmissionResource;
use App\Http\Resources\Professeur\ProfessorNoteResource;
use App\Models\Note;
use App\Models\NoteSubmission;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class NoteValidationController extends Controller
{
    protected function calculateAverage(array $validated): ?float
    {
        $requiredFields = ['cc1', 'cc2', 'cc3', 'efm'];

        foreach ($requiredFields as $field) {
            if (!array_key_exists($field, $validated) || $validated[$field] === null) {
                return null;
            }
        }

        return round(((
            (float) ($validated['cc1'] ?? 0) +
            (float) ($validated['cc2'] ?? 0) +
            (float) ($validated['cc3'] ?? 0) +
            ((float) ($validated['efm'] ?? 0) * 2)
        ) / 5), 2);
    }

    protected function buildWorkflowUpdate(array $grades, string $status, ?string $feedback = null): array
    {
        return Note::prepareWorkflowAttributes([
            'cc1' => $grades['cc1'] ?? null,
            'cc2' => $grades['cc2'] ?? null,
            'cc3' => $grades['cc3'] ?? null,
            'efm' => $grades['efm'] ?? null,
            'note' => $this->calculateAverage($grades),
            'status' => $status,
            'feedback' => $feedback,
            'reviewed_at' => in_array($status, [Note::STATUS_VALIDATED, Note::STATUS_REJECTED], true) ? now() : null,
        ]);
    }

    protected function emptyWorkflowResponse(): JsonResponse
    {
        return response()->json([
            'submission' => null,
            'data' => [],
            'summary' => [
                'total' => 0,
                'draft' => 0,
                'submitted' => 0,
                'validated' => 0,
                'rejected' => 0,
            ],
        ]);
    }

    protected function resolveSubmission(array $payload): ?NoteSubmission
    {
        $submissionId = (int) ($payload['submission_id'] ?? 0);

        if ($submissionId > 0) {
            return NoteSubmission::query()
                ->whereKey($submissionId)
                ->first();
        }

        $groupeId = (int) ($payload['groupe_id'] ?? 0);
        $moduleId = (int) ($payload['module_id'] ?? 0);

        if (!$groupeId || !$moduleId) {
            return null;
        }

        return NoteSubmission::query()
            ->where('groupe_id', $groupeId)
            ->where('module_id', $moduleId)
            ->first();
    }

    protected function summarizeSubmission(NoteSubmission $submission): NoteSubmissionResource
    {
        $submission->loadMissing(['groupe.filiere', 'module.filiere', 'teacher.user']);
        $submission->loadCount('notes');

        return new NoteSubmissionResource($submission);
    }

    protected function buildWorkflowRows(NoteSubmission $submission): Collection
    {
        return $submission->notes
            ->sortBy(fn (Note $note) => mb_strtolower($note->stagiaire?->user?->name ?? ''))
            ->values()
            ->map(function (Note $note) {
                return [
                    'id' => $note->id,
                    'note_id' => $note->id,
                    'submission_id' => $note->submission_id,
                    'stagiaire_id' => $note->stagiaire_id,
                    'module_id' => $note->module_id,
                    'stagiaire' => [
                        'id' => $note->stagiaire?->id,
                        'name' => $note->stagiaire?->user?->name ?: 'Stagiaire',
                        'email' => $note->stagiaire?->user?->email,
                    ],
                    'groupe' => [
                        'id' => $submission->groupe?->id,
                        'nom' => $submission->groupe?->nom,
                        'filiere' => $submission->groupe?->filiere ? [
                            'id' => $submission->groupe->filiere->id,
                            'nom' => $submission->groupe->filiere->nom,
                        ] : null,
                    ],
                    'cc1' => $note->cc1 !== null ? (float) $note->cc1 : null,
                    'cc2' => $note->cc2 !== null ? (float) $note->cc2 : null,
                    'cc3' => $note->cc3 !== null ? (float) $note->cc3 : null,
                    'efm' => $note->efm !== null ? (float) $note->efm : null,
                    'moyenne' => $note->note !== null ? (float) $note->note : null,
                    'status' => $note->workflowStatus(),
                    'feedback' => $note->feedback,
                    'updated_at' => optional($note->updated_at)?->toISOString(),
                ];
            });
    }

    protected function buildWorkflowSummary(Collection $rows): array
    {
        return [
            'total' => $rows->count(),
            'draft' => $rows->where('status', Note::STATUS_DRAFT)->count(),
            'submitted' => $rows->where('status', Note::STATUS_SUBMITTED)->count(),
            'validated' => $rows->where('status', Note::STATUS_VALIDATED)->count(),
            'rejected' => $rows->where('status', Note::STATUS_REJECTED)->count(),
        ];
    }

    protected function notifySubmissionStudents(NoteSubmission $submission, string $messageTemplate): void
    {
        $submission->loadMissing(['notes.stagiaire.user', 'module']);

        foreach ($submission->notes as $note) {
            $stagiaireUser = optional($note->stagiaire)->user;

            if ($stagiaireUser) {
                Notification::create([
                    'user_id' => $stagiaireUser->id,
                    'message' => str_replace(':module', $submission->module?->nom ?? 'ce module', $messageTemplate),
                    'is_read' => false,
                ]);
            }
        }
    }

    protected function approveSubmission(NoteSubmission $submission): NoteSubmission
    {
        DB::transaction(function () use ($submission) {
            $submission->update([
                'status' => NoteSubmission::STATUS_APPROVED,
                'approved_at' => now(),
                'rejected_at' => null,
                'admin_comment' => null,
            ]);

            Note::query()
                ->where('submission_id', $submission->id)
                ->update(Note::prepareWorkflowAttributes([
                    'status' => Note::STATUS_VALIDATED,
                    'feedback' => null,
                    'reviewed_at' => now(),
                    'updated_at' => now(),
                ]));
        });

        $freshSubmission = $submission->fresh(['groupe.filiere', 'module.filiere', 'teacher.user', 'notes.stagiaire.user']);
        $freshSubmission?->loadCount('notes');

        if ($freshSubmission) {
            $this->notifySubmissionStudents($freshSubmission, 'Vos notes du module :module ont ete validees.');
        }

        return $freshSubmission ?? $submission;
    }

    protected function rejectSubmission(NoteSubmission $submission, string $feedback): NoteSubmission
    {
        DB::transaction(function () use ($submission, $feedback) {
            $submission->update([
                'status' => NoteSubmission::STATUS_REJECTED,
                'approved_at' => null,
                'rejected_at' => now(),
                'admin_comment' => $feedback,
            ]);

            Note::query()
                ->where('submission_id', $submission->id)
                ->update(Note::prepareWorkflowAttributes([
                    'status' => Note::STATUS_REJECTED,
                    'feedback' => $feedback,
                    'reviewed_at' => now(),
                    'updated_at' => now(),
                ]));
        });

        $freshSubmission = $submission->fresh(['groupe.filiere', 'module.filiere', 'teacher.user', 'notes.stagiaire.user']);
        $freshSubmission?->loadCount('notes');

        if ($freshSubmission) {
            $this->notifySubmissionStudents($freshSubmission, 'Les notes du module :module ont ete rejetees pour correction.');
        }

        return $freshSubmission ?? $submission;
    }

    public function submissionsIndex(Request $request): JsonResponse
    {
        try {
            $query = NoteSubmission::query()
                ->with(['groupe.filiere', 'module.filiere', 'teacher.user'])
                ->withCount('notes')
                ->whereNotNull('submitted_at');

            if ($request->filled('groupe_id')) {
                $query->where('groupe_id', $request->integer('groupe_id'));
            }

            if ($request->filled('module_id')) {
                $query->where('module_id', $request->integer('module_id'));
            }

            if ($request->filled('status')) {
                $query->where('status', (string) $request->string('status'));
            }

            $submissions = $query
                ->orderByRaw("
                    CASE status
                        WHEN 'pending' THEN 0
                        WHEN 'rejected' THEN 1
                        WHEN 'approved' THEN 2
                        ELSE 3
                    END
                ")
                ->orderByDesc('submitted_at')
                ->paginate(20);

            return NoteSubmissionResource::collection($submissions)->response();
        } catch (Throwable $exception) {
            Log::error('Failed to load note submissions.', [
                'user_id' => $request->user()?->id,
                'filters' => $request->only(['groupe_id', 'module_id', 'status']),
                'exception' => $exception,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Server error',
            ], 500);
        }
    }

    public function indexPending(Request $request): JsonResponse
    {
        return $this->submissionsIndex($request);
    }

    public function showSubmission(NoteSubmission $submission): JsonResponse
    {
        if ($submission->submitted_at === null) {
            return response()->json([
                'message' => 'Submission not found.',
            ], 404);
        }

        $submission->load(['groupe.filiere', 'module.filiere', 'teacher.user', 'notes.stagiaire.user']);
        $submission->loadCount('notes');

        return response()->json([
            'data' => new NoteSubmissionResource($submission),
        ]);
    }

    public function workflow(Request $request): JsonResponse
    {
        $submission = $this->resolveSubmission($request->only(['submission_id', 'groupe_id', 'module_id']));

        if (!$submission || $submission->submitted_at === null) {
            return $this->emptyWorkflowResponse();
        }

        $submission->load(['groupe.filiere', 'module.filiere', 'teacher.user', 'notes.stagiaire.user']);
        $submission->loadCount('notes');

        $rows = $this->buildWorkflowRows($submission);

        return response()->json([
            'submission' => new NoteSubmissionResource($submission),
            'data' => $rows,
            'summary' => $this->buildWorkflowSummary($rows),
        ]);
    }

    public function validateNote(Note $note): JsonResponse
    {
        $note->loadMissing(['submission', 'stagiaire.user', 'stagiaire.groupe', 'module']);

        if ($note->submission) {
            if ($note->submission->submitted_at === null) {
                return response()->json([
                    'message' => 'Aucune soumission de groupe en attente pour cette note.',
                ], 422);
            }

            $submission = $this->approveSubmission($note->submission);

            return response()->json([
                'message' => 'La soumission du groupe a ete validee.',
                'count' => $submission->notes_count ?? $submission->notes()->count(),
                'submission' => new NoteSubmissionResource($submission),
            ]);
        }

        if ($note->workflowStatus() === Note::STATUS_VALIDATED) {
            return response()->json([
                'message' => 'Note already validated.',
                'note' => new ProfessorNoteResource($note->load(['stagiaire.user', 'stagiaire.groupe', 'module'])),
            ]);
        }

        $note->update($this->buildWorkflowUpdate([
            'cc1' => $note->cc1,
            'cc2' => $note->cc2,
            'cc3' => $note->cc3,
            'efm' => $note->efm,
        ], Note::STATUS_VALIDATED));
        $note->load(['stagiaire.user', 'stagiaire.groupe', 'module']);

        $stagiaireUser = optional($note->stagiaire)->user;
        if ($stagiaireUser) {
            Notification::create([
                'user_id' => $stagiaireUser->id,
                'message' => "Votre note du module {$note->module->nom} a ete validee.",
                'is_read' => false,
            ]);
        }

        return response()->json([
            'message' => 'Note validated successfully.',
            'note' => new ProfessorNoteResource($note),
        ]);
    }

    public function rejectNote(Request $request, Note $note): JsonResponse
    {
        $validated = $request->validate([
            'feedback' => ['nullable', 'string', 'max:1000'],
        ]);

        $note->loadMissing(['submission', 'stagiaire.user', 'stagiaire.groupe', 'module']);

        if ($note->submission) {
            if ($note->submission->submitted_at === null) {
                return response()->json([
                    'message' => 'Aucune soumission de groupe en attente pour cette note.',
                ], 422);
            }

            $submission = $this->rejectSubmission($note->submission, $validated['feedback'] ?? 'Veuillez corriger les notes soumises.');

            return response()->json([
                'message' => 'La soumission du groupe a ete rejetee.',
                'count' => $submission->notes_count ?? $submission->notes()->count(),
                'submission' => new NoteSubmissionResource($submission),
            ]);
        }

        $note->update($this->buildWorkflowUpdate([
            'cc1' => $note->cc1,
            'cc2' => $note->cc2,
            'cc3' => $note->cc3,
            'efm' => $note->efm,
        ], Note::STATUS_REJECTED, $validated['feedback'] ?? 'Veuillez revoir cette note.'));
        $note->load(['stagiaire.user', 'stagiaire.groupe', 'module']);

        $stagiaireUser = optional($note->stagiaire)->user;
        if ($stagiaireUser) {
            Notification::create([
                'user_id' => $stagiaireUser->id,
                'message' => "Votre note du module {$note->module->nom} a ete rejetee pour revision.",
                'is_read' => false,
            ]);
        }

        return response()->json([
            'message' => 'Note rejected successfully.',
            'note' => new ProfessorNoteResource($note),
        ]);
    }

    public function validateGroup(GroupNoteActionRequest $request): JsonResponse
    {
        $submission = $this->resolveSubmission($request->validated());

        if (!$submission || $submission->submitted_at === null) {
            return response()->json([
                'message' => 'Aucune soumission de groupe en attente pour cette selection.',
                'count' => 0,
            ], 422);
        }

        $approvedSubmission = $this->approveSubmission($submission);

        return response()->json([
            'message' => 'La soumission du groupe a ete validee.',
            'count' => $approvedSubmission->notes_count ?? $approvedSubmission->notes()->count(),
            'submission' => new NoteSubmissionResource($approvedSubmission),
        ]);
    }

    public function rejectGroup(GroupNoteActionRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $submission = $this->resolveSubmission($validated);

        if (!$submission || $submission->submitted_at === null) {
            return response()->json([
                'message' => 'Aucune soumission de groupe en attente pour cette selection.',
                'count' => 0,
            ], 422);
        }

        $rejectedSubmission = $this->rejectSubmission(
            $submission,
            $validated['feedback'] ?? 'Veuillez corriger les notes soumises.'
        );

        return response()->json([
            'message' => 'La soumission du groupe a ete rejetee.',
            'count' => $rejectedSubmission->notes_count ?? $rejectedSubmission->notes()->count(),
            'submission' => new NoteSubmissionResource($rejectedSubmission),
        ]);
    }

    public function updateManagedNote(UpdateManagedNoteRequest $request, Note $note): JsonResponse
    {
        $validated = $request->validated();
        $nextStatus = $validated['status'] ?? $note->workflowStatus();
        $feedback = array_key_exists('feedback', $validated)
            ? $validated['feedback']
            : ($nextStatus === Note::STATUS_REJECTED ? ($note->feedback ?: 'Veuillez revoir cette note.') : null);

        $note->update($this->buildWorkflowUpdate([
            'cc1' => $validated['cc1'] ?? $note->cc1,
            'cc2' => $validated['cc2'] ?? $note->cc2,
            'cc3' => $validated['cc3'] ?? $note->cc3,
            'efm' => $validated['efm'] ?? $note->efm,
        ], $nextStatus, $feedback));

        $note->load(['stagiaire.user', 'stagiaire.groupe', 'module', 'submission']);

        return response()->json([
            'message' => 'La note a ete mise a jour avec succes.',
            'note' => new ProfessorNoteResource($note),
        ]);
    }
}
