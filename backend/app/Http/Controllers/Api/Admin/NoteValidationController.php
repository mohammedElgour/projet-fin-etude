<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Admin\GroupNoteActionRequest;
use App\Http\Requests\Api\Admin\UpdateManagedNoteRequest;
use App\Http\Resources\Admin\NoteSubmissionResource;
use App\Http\Resources\Professeur\ProfessorNoteResource;
use App\Models\Note;
use App\Models\NoteSubmission;
use App\Models\Stagiaire;
use App\Services\GradeWorkflowService;
use App\Services\NotificationDeliveryService;
use App\Services\StagiaireResultEmailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class NoteValidationController extends Controller
{
    public function __construct(
        private NotificationDeliveryService $notifications,
        private StagiaireResultEmailService $resultsEmails,
        private GradeWorkflowService $gradeWorkflow
    ) {
    }

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
            (float) ($validated['efm'] ?? 0)
        ) / 5), 2);
    }

    protected function evaluationDefinitions(): array
    {
        return [
            'controle_1' => ['grade_field' => 'cc1', 'label' => 'Contrôle 1'],
            'controle_2' => ['grade_field' => 'cc2', 'label' => 'Contrôle 2'],
            'controle_3' => ['grade_field' => 'cc3', 'label' => 'Contrôle 3'],
            'efm' => ['grade_field' => 'efm', 'label' => 'EFM'],
        ];
    }

    protected function evaluationLabel(string $evaluationType): string
    {
        return $this->evaluationDefinitions()[$evaluationType]['label'] ?? ucfirst(str_replace('_', ' ', $evaluationType));
    }

    protected function evaluationGradeField(string $evaluationType): ?string
    {
        return $this->evaluationDefinitions()[$evaluationType]['grade_field'] ?? null;
    }

    protected function evaluationStatusField(string $evaluationType): ?string
    {
        $gradeField = $this->evaluationGradeField($evaluationType);

        return $gradeField ? Note::COMPONENT_STATUS_FIELDS[$gradeField] ?? null : null;
    }

    protected function captureNoteBeforeState(Note $note): array
    {
        return $note->exists ? $note->workflowSnapshot() : [];
    }

    protected function logNoteWorkflowChange(Note $note, string $action, array $before, array $after, ?int $createdBy = null): void
    {
        $this->gradeWorkflow->recordHistory($note, $action, $before, $after, $createdBy);
        $this->gradeWorkflow->logAction(sprintf('Admin grade %s', $action), [
            'note_id' => $note->id,
            'submission_id' => $note->submission_id,
            'stagiaire_id' => $note->stagiaire_id,
            'module_id' => $note->module_id,
            'created_by' => $createdBy,
        ]);
    }

    protected function normalizeEvaluationType(?string $evaluationType): ?string
    {
        $evaluationType = $evaluationType ? strtolower(trim($evaluationType)) : null;

        return $evaluationType && isset($this->evaluationDefinitions()[$evaluationType]) ? $evaluationType : null;
    }

    protected function evaluationTypeLabel(?string $evaluationType): string
    {
        $evaluationType = $this->normalizeEvaluationType($evaluationType);

        return $evaluationType ? $this->evaluationLabel($evaluationType) : 'Evaluation';
    }

    protected function buildEvaluationHistory(Note $note, string $evaluationType): array
    {
        $statusField = $this->evaluationStatusField($evaluationType);
        $status = $statusField ? Note::normalizeWorkflowStatus($note->{$statusField} ?? null) : Note::STATUS_DRAFT;

        return [
            [
                'label' => 'Soumission',
                'status' => $status === Note::STATUS_DRAFT ? 'draft' : 'submitted',
                'date' => optional($note->updated_at)?->toISOString(),
                'message' => $status === Note::STATUS_DRAFT
                    ? 'Aucune soumission active pour cette evaluation.'
                    : 'L evaluation a ete envoyee pour validation.',
            ],
            [
                'label' => 'Decision admin',
                'status' => $status,
                'date' => optional($note->reviewed_at)?->toISOString(),
                'message' => match ($status) {
                    Note::STATUS_APPROVED => 'L evaluation a ete approuvee.',
                    Note::STATUS_REJECTED => 'L evaluation a ete rejetee.',
                    default => 'En attente de decision.',
                },
            ],
        ];
    }

    protected function buildEvaluationRow(Note $note, string $evaluationType): array
    {
        $gradeField = $this->evaluationGradeField($evaluationType);
        $statusField = $this->evaluationStatusField($evaluationType);

        if (!$gradeField || !$statusField) {
            return [];
        }

        $status = Note::normalizeWorkflowStatus($note->{$statusField} ?? null);

        return [
            'id' => sprintf('%s:%s', $note->id, $evaluationType),
            'note_id' => $note->id,
            'submission_id' => $note->submission_id,
            'stagiaire_id' => $note->stagiaire_id,
            'module_id' => $note->module_id,
            'evaluation_type' => $evaluationType,
            'evaluation_label' => $this->evaluationLabel($evaluationType),
            'grade_field' => $gradeField,
            'grade_value' => $note->{$gradeField} !== null ? (float) $note->{$gradeField} : null,
            'status' => $status,
            'submission_date' => optional($note->updated_at)?->toISOString(),
            'feedback' => $status === Note::STATUS_REJECTED ? $note->feedback : null,
            'student' => [
                'id' => $note->stagiaire?->id,
                'name' => $note->stagiaire?->user?->name ?: 'Stagiaire',
                'email' => $note->stagiaire?->user?->email,
            ],
            'groupe' => [
                'id' => $note->stagiaire?->groupe?->id,
                'nom' => $note->stagiaire?->groupe?->nom,
                'filiere' => $note->stagiaire?->groupe?->filiere ? [
                    'id' => $note->stagiaire->groupe->filiere->id,
                    'nom' => $note->stagiaire->groupe->filiere->nom,
                ] : null,
            ],
            'module' => [
                'id' => $note->module?->id,
                'nom' => $note->module?->nom,
                'code' => $note->module?->code,
            ],
            'professor' => [
                'id' => $note->submission?->teacher?->id,
                'name' => $note->submission?->teacher?->user?->name ?: $note->submission?->teacher?->name,
                'email' => $note->submission?->teacher?->user?->email,
            ],
            'history' => $this->buildEvaluationHistory($note, $evaluationType),
        ];
    }

    protected function buildLegacyEvaluationRow(Note $note): array
    {
        return [
            'id' => (string) $note->id,
            'note_id' => $note->id,
            'submission_id' => $note->submission_id,
            'stagiaire_id' => $note->stagiaire_id,
            'module_id' => $note->module_id,
            'evaluation_type' => 'legacy',
            'evaluation_label' => 'Evaluation',
            'grade_field' => 'note',
            'grade_value' => $note->note !== null ? (float) $note->note : null,
            'status' => $note->workflowStatus(),
            'submission_date' => optional($note->updated_at)?->toISOString(),
            'feedback' => $note->feedback,
            'student' => [
                'id' => $note->stagiaire?->id,
                'name' => $note->stagiaire?->user?->name ?: 'Stagiaire',
                'email' => $note->stagiaire?->user?->email,
            ],
            'groupe' => [
                'id' => $note->stagiaire?->groupe?->id,
                'nom' => $note->stagiaire?->groupe?->nom,
                'filiere' => $note->stagiaire?->groupe?->filiere ? [
                    'id' => $note->stagiaire->groupe->filiere->id,
                    'nom' => $note->stagiaire->groupe->filiere->nom,
                ] : null,
            ],
            'module' => [
                'id' => $note->module?->id,
                'nom' => $note->module?->nom,
                'code' => $note->module?->code,
            ],
            'professor' => [
                'id' => $note->submission?->teacher?->id,
                'name' => $note->submission?->teacher?->user?->name ?: $note->submission?->teacher?->name,
                'email' => $note->submission?->teacher?->user?->email,
            ],
            'history' => [
                [
                    'label' => 'Soumission',
                    'status' => $note->workflowStatus(),
                    'date' => optional($note->updated_at)?->toISOString(),
                    'message' => 'Soumission legacy du module en attente de validation.',
                ],
                [
                    'label' => 'Decision admin',
                    'status' => $note->workflowStatus(),
                    'date' => optional($note->reviewed_at)?->toISOString(),
                    'message' => $note->workflowStatus() === Note::STATUS_REJECTED
                        ? 'La note a ete rejetee.'
                        : ($note->workflowStatus() === Note::STATUS_APPROVED ? 'La note a ete approuvee.' : 'En attente de decision.'),
                ],
            ],
        ];
    }

    protected function setEvaluationState(Note $note, string $evaluationType, string $status, ?string $feedback = null): Note
    {
        $statusField = $this->evaluationStatusField($evaluationType);
        $gradeField = $this->evaluationGradeField($evaluationType);

        if (!$statusField || !$gradeField) {
            return $note;
        }

        $attributes = [
            'submission_id' => $note->submission_id,
            'stagiaire_id' => $note->stagiaire_id,
            'module_id' => $note->module_id,
            'cc1' => $note->cc1,
            'cc2' => $note->cc2,
            'cc3' => $note->cc3,
            'efm' => $note->efm,
            'controle1_status' => $note->controle1_status ?? Note::STATUS_DRAFT,
            'controle2_status' => $note->controle2_status ?? Note::STATUS_DRAFT,
            'controle3_status' => $note->controle3_status ?? Note::STATUS_DRAFT,
            'efm_status' => $note->efm_status ?? Note::STATUS_DRAFT,
            'note' => $note->note,
            'status' => $note->workflowStatus(),
            'validation_status' => $note->validation_status ?? $note->workflowStatus(),
            'feedback' => $feedback,
            'reviewed_at' => now(),
        ];

        $before = $note->workflowSnapshot();
        $attributes[$statusField] = $status;

        $prepared = Note::prepareWorkflowAttributes($attributes);

        if ($prepared['status'] === Note::STATUS_APPROVED) {
            $calculatedAverage = $this->calculateAverage($prepared);
            if ($calculatedAverage !== null) {
                $prepared['note'] = $calculatedAverage;
            }
        }

        $note->fill($prepared);
        $note->save();
        $note->refresh();

        if ($note->submission) {
            $this->gradeWorkflow->snapshotSubmissionFromNote($note->submission, $note);
        }

        $this->logNoteWorkflowChange($note, $status, $before, $note->workflowSnapshot(), (int) request()->user()?->id);

        return $note->fresh(['submission.teacher.user', 'stagiaire.user', 'stagiaire.groupe.filiere', 'module']);
    }

    protected function syncSubmissionState(Note $note): ?NoteSubmission
    {
        $submission = $note->submission;

        if (!$submission) {
            return null;
        }

        $submission->loadMissing(['notes']);
        $this->gradeWorkflow->assertSubmissionHasNotes($submission);
        $derived = $submission->deriveWorkflowState();

        $submission->update([
            'status' => in_array($derived['status'], [Note::STATUS_DRAFT, Note::STATUS_SUBMITTED], true)
                ? NoteSubmission::STATUS_PENDING
                : $derived['status'],
            'submitted_at' => $derived['submitted_at'],
            'approved_at' => $derived['approved_at'],
            'rejected_at' => $derived['rejected_at'],
        ]);

        $submission->notes->each(fn (Note $submissionNote) => $submission->syncSnapshotFromNote($submissionNote));
        $submission->save();

        return $submission->fresh(['groupe.filiere', 'module.filiere', 'teacher.user', 'notes.stagiaire.user']);
    }

    protected function notifyEvaluationStudent(Note $note, string $message): void
    {
        $note->loadMissing(['stagiaire.user']);

        $studentUser = $note->stagiaire?->user;
        if ($studentUser) {
            $this->notifications->sendToUsers(
                [$studentUser],
                'Validation des notes',
                $message
            );
        }
    }

    protected function buildWorkflowUpdate(array $grades, string $status, ?string $feedback = null): array
    {
        return Note::prepareWorkflowAttributes([
            'cc1' => $grades['cc1'] ?? null,
            'cc2' => $grades['cc2'] ?? null,
            'cc3' => $grades['cc3'] ?? null,
            'efm' => $grades['efm'] ?? null,
            'note' => $status === Note::STATUS_APPROVED ? $this->calculateAverage($grades) : null,
            'status' => $status,
            'feedback' => $feedback,
            'reviewed_at' => in_array($status, [Note::STATUS_APPROVED, Note::STATUS_REJECTED], true) ? now() : null,
        ]);
    }

    protected function buildManagedNoteUpdate(Note $note, array $validated): array
    {
        $attributes = [
            'cc1' => array_key_exists('cc1', $validated) ? $validated['cc1'] : $note->cc1,
            'cc2' => array_key_exists('cc2', $validated) ? $validated['cc2'] : $note->cc2,
            'cc3' => array_key_exists('cc3', $validated) ? $validated['cc3'] : $note->cc3,
            'efm' => array_key_exists('efm', $validated) ? $validated['efm'] : $note->efm,
            'controle1_status' => array_key_exists('controle1_status', $validated)
                ? $validated['controle1_status']
                : ($note->controle1_status ?? Note::STATUS_DRAFT),
            'controle2_status' => array_key_exists('controle2_status', $validated)
                ? $validated['controle2_status']
                : ($note->controle2_status ?? Note::STATUS_DRAFT),
            'controle3_status' => array_key_exists('controle3_status', $validated)
                ? $validated['controle3_status']
                : ($note->controle3_status ?? Note::STATUS_DRAFT),
            'efm_status' => array_key_exists('efm_status', $validated)
                ? $validated['efm_status']
                : ($note->efm_status ?? Note::STATUS_DRAFT),
            'status' => $validated['status'] ?? $note->workflowStatus(),
            'feedback' => array_key_exists('feedback', $validated)
                ? $validated['feedback']
                : $note->feedback,
            'reviewed_at' => in_array($validated['status'] ?? $note->workflowStatus(), [Note::STATUS_APPROVED, Note::STATUS_REJECTED], true)
                ? now()
                : $note->reviewed_at,
        ];

        $prepared = Note::prepareWorkflowAttributes($attributes);

        if ($prepared['status'] === Note::STATUS_APPROVED) {
            $calculatedAverage = $this->calculateAverage($prepared);
            if ($calculatedAverage !== null) {
                $prepared['note'] = $calculatedAverage;
            }
        }

        return $prepared;
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
                'approved' => 0,
                'rejected' => 0,
            ],
        ]);
    }

    public function evaluationQueueIndex(Request $request): JsonResponse
    {
        try {
            $query = NoteSubmission::query()
                ->with([
                    'groupe.filiere',
                    'module.filiere',
                    'teacher.user',
                    'notes.stagiaire.user',
                    'notes.stagiaire.groupe.filiere',
                    'notes.module',
                ])
                ->withCount('notes')
                ->whereNotNull('submitted_at');

            if ($request->filled('groupe_id')) {
                $query->where('groupe_id', $request->integer('groupe_id'));
            }

            if ($request->filled('module_id')) {
                $query->where('module_id', $request->integer('module_id'));
            }

            if ($request->filled('evaluation_type')) {
                $evaluationType = $this->normalizeEvaluationType((string) $request->string('evaluation_type'));
                if ($evaluationType) {
                    $query->where('evaluation_type', $evaluationType);
                }
            }

            if ($request->filled('status')) {
                $requestedStatus = Note::normalizeWorkflowStatus((string) $request->string('status'));

                $query->where('status', match ($requestedStatus) {
                    Note::STATUS_APPROVED => NoteSubmission::STATUS_APPROVED,
                    Note::STATUS_REJECTED => NoteSubmission::STATUS_REJECTED,
                    default => NoteSubmission::STATUS_PENDING,
                });
            } else {
                $query->where('status', NoteSubmission::STATUS_PENDING);
            }

            $submissions = $query
                ->orderByRaw("CASE status WHEN 'pending' THEN 0 WHEN 'rejected' THEN 1 WHEN 'approved' THEN 2 ELSE 3 END")
                ->orderByDesc('submitted_at')
                ->get();

            return response()->json([
                'data' => NoteSubmissionResource::collection($submissions)->resolve($request),
                'summary' => [
                    'total' => $submissions->count(),
                    'submitted' => $submissions->where('status', NoteSubmission::STATUS_PENDING)->count(),
                    'approved' => $submissions->where('status', NoteSubmission::STATUS_APPROVED)->count(),
                    'rejected' => $submissions->where('status', NoteSubmission::STATUS_REJECTED)->count(),
                ],
            ]);
        } catch (Throwable $exception) {
            Log::error('Failed to load evaluation queue.', [
                'user_id' => $request->user()?->id,
                'filters' => $request->only(['groupe_id', 'module_id', 'stagiaire_id', 'evaluation_type']),
                'exception' => $exception,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Server error',
            ], 500);
        }
    }

    public function showEvaluation(Request $request, Note $note): JsonResponse
    {
        $evaluationType = $this->normalizeEvaluationType((string) $request->query('evaluation_type', ''));

        if (!$evaluationType && Note::hasComponentStatusColumns()) {
            return response()->json([
                'message' => 'Evaluation type missing.',
            ], 422);
        }

        $note->load(['stagiaire.user', 'stagiaire.groupe.filiere', 'module', 'submission.teacher.user']);

        $row = $evaluationType ? $this->buildEvaluationRow($note, $evaluationType) : $this->buildLegacyEvaluationRow($note);

        if (!$row) {
            return response()->json([
                'message' => 'Evaluation not found.',
            ], 404);
        }

        return response()->json([
            'data' => $row,
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
        $evaluationType = $this->normalizeEvaluationType($payload['evaluation_type'] ?? null);

        if (!$groupeId || !$moduleId) {
            return null;
        }

        $query = NoteSubmission::query()
            ->where('groupe_id', $groupeId)
            ->where('module_id', $moduleId);

        if ($evaluationType) {
            $query->where('evaluation_type', $evaluationType);
        }

        return $query->orderByDesc('submitted_at')->first();
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
                    'controle1_status' => Note::normalizeWorkflowStatus($note->controle1_status ?? null),
                    'cc2' => $note->cc2 !== null ? (float) $note->cc2 : null,
                    'controle2_status' => Note::normalizeWorkflowStatus($note->controle2_status ?? null),
                    'cc3' => $note->cc3 !== null ? (float) $note->cc3 : null,
                    'controle3_status' => Note::normalizeWorkflowStatus($note->controle3_status ?? null),
                    'efm' => $note->efm !== null ? (float) $note->efm : null,
                    'efm_status' => Note::normalizeWorkflowStatus($note->efm_status ?? null),
                    'moyenne' => $note->finalAverage(),
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
            'approved' => $rows->where('status', Note::STATUS_APPROVED)->count(),
            'rejected' => $rows->where('status', Note::STATUS_REJECTED)->count(),
        ];
    }

    protected function notifySubmissionStudents(NoteSubmission $submission, string $messageTemplate): void
    {
        $submission->loadMissing(['notes.stagiaire.user', 'module']);

        $this->notifications->sendToUsers(
            $submission->notes->pluck('stagiaire.user'),
            'Validation des notes',
            str_replace(':module', $submission->module?->nom ?? 'ce module', $messageTemplate)
        );

        $this->notifyResultsAvailability($submission);
    }

    protected function notifyResultsAvailability(NoteSubmission $submission): void
    {
        $submission->loadMissing(['notes.stagiaire.user', 'notes.stagiaire.groupe.filiere']);

        $submission->notes
            ->pluck('stagiaire')
            ->filter()
            ->unique('id')
            ->each(fn (Stagiaire $stagiaire) => $this->resultsEmails->notifyIfReady($stagiaire));
    }

    protected function buildSubmissionNoteUpdate(Note $note, NoteSubmission $submission, string $status, ?string $feedback = null): array
    {
        $payload = [
            'submission_id' => $submission->id,
            'stagiaire_id' => $note->stagiaire_id,
            'module_id' => $note->module_id,
            'cc1' => $note->cc1,
            'cc2' => $note->cc2,
            'cc3' => $note->cc3,
            'efm' => $note->efm,
            'controle1_status' => $note->controle1_status ?? Note::STATUS_DRAFT,
            'controle2_status' => $note->controle2_status ?? Note::STATUS_DRAFT,
            'controle3_status' => $note->controle3_status ?? Note::STATUS_DRAFT,
            'efm_status' => $note->efm_status ?? Note::STATUS_DRAFT,
            'status' => $note->workflowStatus(),
            'validation_status' => $note->validation_status ?? $note->workflowStatus(),
            'feedback' => $feedback,
            'reviewed_at' => now(),
            'note' => $note->note,
        ];

        $statusField = $submission->evaluationStatusField();

        if ($statusField) {
            $payload[$statusField] = $status;
        } else {
            foreach (Note::COMPONENT_STATUS_FIELDS as $componentStatusField) {
                $payload[$componentStatusField] = $status;
            }

            $payload['status'] = $status;
        }

        $prepared = Note::prepareWorkflowAttributes($payload);

        if ($prepared['status'] === Note::STATUS_APPROVED) {
            $calculatedAverage = $this->calculateAverage($prepared);
            if ($calculatedAverage !== null) {
                $prepared['note'] = $calculatedAverage;
            }
        }

        return $prepared;
    }

    protected function approveSubmission(NoteSubmission $submission): NoteSubmission
    {
        DB::transaction(function () use ($submission) {
            $submission->loadMissing(['notes']);
            $this->gradeWorkflow->assertSubmissionHasNotes($submission);

            $submission->update([
                'status' => NoteSubmission::STATUS_APPROVED,
                'approved_at' => now(),
                'rejected_at' => null,
                'admin_comment' => null,
            ]);

            foreach ($submission->notes as $note) {
                $before = $this->captureNoteBeforeState($note);
                $note->fill($this->buildSubmissionNoteUpdate($note, $submission, Note::STATUS_APPROVED, null));
                $note->save();
                $note->refresh();
                $this->gradeWorkflow->snapshotSubmissionFromNote($submission, $note);
                $this->logNoteWorkflowChange($note, 'approved', $before, $note->workflowSnapshot(), (int) request()->user()?->id);
            }

            $latestNote = $submission->notes
                ->sortByDesc(fn (Note $note) => optional($note->updated_at)?->getTimestamp() ?? 0)
                ->first();

            if ($latestNote) {
                $submission->fill($this->gradeWorkflow->submissionSnapshotPayload($latestNote));
                $submission->save();
            }
        });

        $freshSubmission = $submission->fresh(['groupe.filiere', 'module.filiere', 'teacher.user', 'notes.stagiaire.user']);
        $freshSubmission?->loadCount('notes');

        if ($freshSubmission) {
            $this->notifySubmissionStudents($freshSubmission, 'Vos notes ont été validées');
        }

        return $freshSubmission ?? $submission;
    }

    protected function rejectSubmission(NoteSubmission $submission, string $feedback): NoteSubmission
    {
        DB::transaction(function () use ($submission, $feedback) {
            $submission->loadMissing(['notes']);
            $this->gradeWorkflow->assertSubmissionHasNotes($submission);

            $submission->update([
                'status' => NoteSubmission::STATUS_REJECTED,
                'approved_at' => null,
                'rejected_at' => now(),
                'admin_comment' => $feedback,
            ]);

            foreach ($submission->notes as $note) {
                $before = $this->captureNoteBeforeState($note);
                $note->fill($this->buildSubmissionNoteUpdate($note, $submission, Note::STATUS_REJECTED, $feedback));
                $note->save();
                $note->refresh();
                $this->gradeWorkflow->snapshotSubmissionFromNote($submission, $note);
                $this->logNoteWorkflowChange($note, 'rejected', $before, $note->workflowSnapshot(), (int) request()->user()?->id);
            }

            $latestNote = $submission->notes
                ->sortByDesc(fn (Note $note) => optional($note->updated_at)?->getTimestamp() ?? 0)
                ->first();

            if ($latestNote) {
                $submission->fill($this->gradeWorkflow->submissionSnapshotPayload($latestNote));
                $submission->save();
            }
        });

        $freshSubmission = $submission->fresh(['groupe.filiere', 'module.filiere', 'teacher.user', 'notes.stagiaire.user']);
        $freshSubmission?->loadCount('notes');

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

        $submission->load([
            'groupe.filiere',
            'module.filiere',
            'teacher.user',
            'notes.stagiaire.user',
            'notes.stagiaire.groupe.filiere',
            'notes.module',
        ]);
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
        $evaluationType = $this->normalizeEvaluationType((string) request()->input('evaluation_type', request()->query('evaluation_type', '')));
        $note->loadMissing(['submission', 'stagiaire.user', 'stagiaire.groupe', 'module']);

        if ($evaluationType) {
            $statusField = $this->evaluationStatusField($evaluationType);
            $currentStatus = $statusField ? Note::normalizeWorkflowStatus($note->{$statusField} ?? null) : Note::STATUS_DRAFT;

            if ($currentStatus !== Note::STATUS_SUBMITTED) {
                return response()->json([
                    'message' => 'Aucune evaluation en attente pour cette note.',
                ], 422);
            }

            $updatedNote = $this->setEvaluationState(
                $note,
                $evaluationType,
                Note::STATUS_APPROVED,
                null
            );

            $submission = $this->syncSubmissionState($updatedNote);

            $this->notifyEvaluationStudent(
                $updatedNote,
                sprintf('Votre %s a ete valide.', $this->evaluationLabel($evaluationType))
            );

            if ($submission && $submission->workflowStatus() === Note::STATUS_APPROVED) {
                $this->notifySubmissionStudents($submission, 'Vos notes ont Ã©tÃ© validÃ©es');
            }

            return response()->json([
                'message' => 'L evaluation a ete validee avec succes.',
                'note' => new ProfessorNoteResource($updatedNote),
                'evaluation' => $this->buildEvaluationRow($updatedNote, $evaluationType),
            ]);
        }

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
            $this->notifications->sendToUsers(
                [$stagiaireUser],
                'Validation des notes',
                'Vos notes ont été validées'
            );
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
            'evaluation_type' => ['nullable', 'string'],
        ]);

        $evaluationType = $this->normalizeEvaluationType($validated['evaluation_type'] ?? null);
        $note->loadMissing(['submission', 'stagiaire.user', 'stagiaire.groupe', 'module']);

        if ($evaluationType) {
            $statusField = $this->evaluationStatusField($evaluationType);
            $currentStatus = $statusField ? Note::normalizeWorkflowStatus($note->{$statusField} ?? null) : Note::STATUS_DRAFT;

            if ($currentStatus !== Note::STATUS_SUBMITTED) {
                return response()->json([
                    'message' => 'Aucune evaluation en attente pour cette note.',
                ], 422);
            }

            $updatedNote = $this->setEvaluationState(
                $note,
                $evaluationType,
                Note::STATUS_REJECTED,
                $validated['feedback'] ?? 'Veuillez revoir cette evaluation.'
            );

            $submission = $this->syncSubmissionState($updatedNote);

            $this->notifyEvaluationStudent(
                $updatedNote,
                sprintf(
                    'Votre %s a ete rejetee. %s',
                    $this->evaluationLabel($evaluationType),
                    $validated['feedback'] ?? 'Veuillez consulter le detail de la validation.'
                )
            );

            return response()->json([
                'message' => 'L evaluation a ete rejetee avec succes.',
                'note' => new ProfessorNoteResource($updatedNote),
                'evaluation' => $this->buildEvaluationRow($updatedNote, $evaluationType),
                'submission' => $submission ? new NoteSubmissionResource($submission) : null,
            ]);
        }

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

        $submission->loadCount('notes');

        if (($submission->notes_count ?? 0) === 0) {
            $submission->load(['groupe.filiere', 'module.filiere', 'teacher.user']);

            return response()->json([
                'message' => 'Aucune note n est associee a cette soumission de groupe.',
                'status' => 'empty',
                'validated' => false,
                'count' => 0,
                'submission' => new NoteSubmissionResource($submission),
            ]);
        }

        $approvedSubmission = $this->approveSubmission($submission);

        return response()->json([
            'message' => 'La soumission du groupe a ete validee.',
            'status' => 'validated',
            'validated' => true,
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
