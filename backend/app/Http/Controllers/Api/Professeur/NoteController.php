<?php

namespace App\Http\Controllers\Api\Professeur;

use App\Http\Controllers\Api\Professeur\Concerns\ResolvesProfessorScope;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Professeur\SaveBatchNotesRequest;
use App\Http\Requests\Api\Professeur\StoreNoteRequest;
use App\Http\Requests\Api\Professeur\SubmitNotesRequest;
use App\Http\Requests\Api\Professeur\UpdateNoteRequest;
use App\Http\Resources\Admin\NoteSubmissionResource;
use App\Http\Resources\Professeur\ProfessorNoteResource;
use App\Models\Note;
use App\Models\NoteSubmission;
use App\Models\Stagiaire;
use App\Models\User;
use App\Services\GradeWorkflowService;
use App\Services\NotificationDeliveryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class NoteController extends Controller
{
    use ResolvesProfessorScope;

    public function __construct(
        private NotificationDeliveryService $notifications,
        private GradeWorkflowService $gradeWorkflow
    ) {
    }

    protected function calculateAverage(array $validated): ?float
    {
        foreach (['cc1', 'cc2', 'cc3', 'efm'] as $field) {
            if (! array_key_exists($field, $validated) || $validated[$field] === null) {
                return null;
            }
        }

        return round(((float) $validated['cc1'] + (float) $validated['cc2'] + (float) $validated['cc3'] + (float) $validated['efm']) / 5, 2);
    }

    protected function normalizeEvaluationType(?string $evaluationType): ?string
    {
        $evaluationType = $evaluationType ? strtolower(trim($evaluationType)) : null;

        return in_array($evaluationType, ['controle_1', 'controle_2', 'controle_3', 'efm'], true)
            ? $evaluationType
            : null;
    }

    protected function mapBatchNotePayload(array $noteData, ?string $evaluationType = null): array
    {
        if ($evaluationType === null) {
            return [
                'cc1' => $noteData['controle_1'] ?? null,
                'cc2' => $noteData['controle_2'] ?? null,
                'cc3' => $noteData['controle_3'] ?? null,
                'efm' => $noteData['efm'] ?? null,
            ];
        }

        return match ($evaluationType) {
            'controle_1' => ['cc1' => $noteData['controle_1'] ?? $noteData['cc1'] ?? null],
            'controle_2' => ['cc2' => $noteData['controle_2'] ?? $noteData['cc2'] ?? null],
            'controle_3' => ['cc3' => $noteData['controle_3'] ?? $noteData['cc3'] ?? null],
            'efm' => ['efm' => $noteData['efm'] ?? null],
            default => [],
        };
    }

    protected function componentStatusField(string $gradeField): string
    {
        return Note::COMPONENT_STATUS_FIELDS[$gradeField] ?? $gradeField.'_status';
    }

    protected function componentRequestField(string $gradeField): string
    {
        return match ($gradeField) {
            'cc1' => 'controle_1',
            'cc2' => 'controle_2',
            'cc3' => 'controle_3',
            'efm' => 'efm',
            default => $gradeField,
        };
    }

    protected function buildNoteWorkflowPayload(Note $note, array $incomingGrades, string $actionStatus): array
    {
        $payload = [
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
            'status' => $actionStatus,
            'validation_status' => $actionStatus,
            'feedback' => $note->feedback,
            'reviewed_at' => $note->reviewed_at,
        ];

        foreach (Note::COMPONENT_FIELDS as $gradeField) {
            $requestField = $this->componentRequestField($gradeField);
            $statusField = $this->componentStatusField($gradeField);
            $incomingValueExists = array_key_exists($requestField, $incomingGrades) || array_key_exists($gradeField, $incomingGrades);

            if (! $incomingValueExists) {
                continue;
            }

            $incomingValue = array_key_exists($requestField, $incomingGrades)
                ? $incomingGrades[$requestField]
                : $incomingGrades[$gradeField];
            $existingValue = $payload[$gradeField];
            $existingStatus = Note::normalizeWorkflowStatus($payload[$statusField] ?? null);

            if ($existingStatus === Note::STATUS_APPROVED && $incomingValue !== null && (string) $incomingValue !== (string) $existingValue) {
                throw ValidationException::withMessages([
                    $requestField => ['Les notes approuvees ne peuvent plus etre modifiees.'],
                ]);
            }

            $payload[$gradeField] = $incomingValue === '' ? null : $incomingValue;
            $payload[$statusField] = $payload[$gradeField] === null
                ? Note::STATUS_DRAFT
                : $actionStatus;
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

    protected function submissionCanBeEdited(?NoteSubmission $submission): bool
    {
        if (! $submission) {
            return true;
        }

        return $submission->workflowStatus() !== Note::STATUS_APPROVED;
    }

    protected function resolveSubmissionContainer(int $groupeId, int $moduleId, int $teacherId, ?string $evaluationType = null): NoteSubmission
    {
        $submission = NoteSubmission::query()->firstOrCreate(
            [
                'groupe_id' => $groupeId,
                'module_id' => $moduleId,
                'evaluation_type' => $evaluationType,
            ],
            [
                'teacher_id' => $teacherId,
                'status' => NoteSubmission::STATUS_PENDING,
                'submitted_at' => null,
                'approved_at' => null,
                'rejected_at' => null,
                'admin_comment' => null,
            ]
        );

        if ((int) ($submission->teacher_id ?? 0) !== $teacherId) {
            $submission->update(['teacher_id' => $teacherId]);
        }

        return $submission;
    }

    protected function resolveBatchEvaluationType(Collection $noteEntries, ?string $providedEvaluationType = null): ?string
    {
        $evaluationType = $this->normalizeEvaluationType($providedEvaluationType);

        if ($evaluationType) {
            return $evaluationType;
        }

        $presentFields = $noteEntries
            ->flatMap(function (array $noteData): array {
                return collect([
                    'controle_1' => array_key_exists('controle_1', $noteData) && $noteData['controle_1'] !== null,
                    'controle_2' => array_key_exists('controle_2', $noteData) && $noteData['controle_2'] !== null,
                    'controle_3' => array_key_exists('controle_3', $noteData) && $noteData['controle_3'] !== null,
                    'efm' => array_key_exists('efm', $noteData) && $noteData['efm'] !== null,
                ])->filter()->keys()->all();
            })
            ->unique()
            ->values();

        return $presentFields->count() === 1 ? $presentFields->first() : null;
    }

    protected function captureWorkflowBeforeState(Note $note): array
    {
        return $note->exists ? $note->workflowSnapshot() : [];
    }

    protected function persistWorkflowSnapshot(
        Note $note,
        NoteSubmission $submission,
        string $action,
        array $before,
        ?int $createdBy = null
    ): void {
        $after = $note->workflowSnapshot();

        $this->gradeWorkflow->recordHistory($note, $action, $before, $after, $createdBy);
        $this->gradeWorkflow->snapshotSubmissionFromNote($submission, $note);
        $this->gradeWorkflow->logAction(sprintf('Grade %s', $action), [
            'note_id' => $note->id,
            'submission_id' => $note->submission_id,
            'stagiaire_id' => $note->stagiaire_id,
            'module_id' => $note->module_id,
            'component_values' => [
                'cc1' => $note->cc1,
                'cc2' => $note->cc2,
                'cc3' => $note->cc3,
                'efm' => $note->efm,
                'final_grade' => $note->note,
            ],
            'action' => $action,
            'created_by' => $createdBy,
        ]);
    }

    protected function ensureProfessorScope(Request $request, int $groupeId, int $moduleId): JsonResponse|array
    {
        $professeur = $this->resolveProfessorProfile($request);
        $professeur->loadMissing(['modules', 'groupes']);

        $isModuleAssigned = $professeur->modules->contains(fn ($module) => (int) $module->id === $moduleId);
        $isGroupeAssigned = $professeur->groupes->contains(fn ($groupe) => (int) $groupe->id === $groupeId);

        if (! $isModuleAssigned || ! $isGroupeAssigned) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return [$professeur];
    }

    protected function collectGroupStudentIds(int $groupeId): Collection
    {
        return Stagiaire::query()
            ->where('groupe_id', $groupeId)
            ->orderBy('id')
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values();
    }

    protected function validateStudentsBelongToGroup(Collection $noteEntries, int $groupeId): ?JsonResponse
    {
        $stagiaireIds = $noteEntries->pluck('stagiaire_id')->map(fn ($id) => (int) $id)->all();

        $allowedStudentIds = Stagiaire::query()
            ->where('groupe_id', $groupeId)
            ->whereIn('id', $stagiaireIds)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        if (count($allowedStudentIds) !== count($stagiaireIds)) {
            return response()->json([
                'message' => 'One or more stagiaires do not belong to the selected groupe.',
                'errors' => [
                    'notes' => ['Every stagiaire must belong to the selected groupe.'],
                ],
            ], 422);
        }

        return null;
    }

    protected function summarizeSubmission(NoteSubmission $submission): NoteSubmissionResource
    {
        $submission->loadMissing(['groupe.filiere', 'module.filiere', 'teacher.user']);
        $submission->loadCount('notes');

        return new NoteSubmissionResource($submission);
    }

    protected function notifyStudents(iterable $notes, string $messageTemplate): void
    {
        foreach ($notes as $note) {
            if ($note->stagiaire && $note->stagiaire->user) {
                $this->notifications->sendToUsers(
                    [$note->stagiaire->user],
                    'Notification de notes',
                    str_replace(':module', $note->module?->nom ?? 'ce module', $messageTemplate)
                );
            }
        }
    }

    protected function notifyAdminsAboutSubmittedNotes(): void
    {
        $admins = User::query()
            ->where('role', 'admin')
            ->get();

        $this->notifications->sendToUsers(
            $admins,
            'Soumission des notes',
            'Les notes ont été soumises et attendent validation'
        );
    }

    protected function syncSubmissionWorkflow(NoteSubmission $submission): NoteSubmission
    {
        $submission->loadMissing(['notes']);
        $this->gradeWorkflow->assertSubmissionHasNotes($submission);
        $derived = $submission->deriveWorkflowState();

        $submission->update([
            'status' => match ($derived['status']) {
                Note::STATUS_APPROVED => NoteSubmission::STATUS_APPROVED,
                Note::STATUS_REJECTED => NoteSubmission::STATUS_REJECTED,
                default => NoteSubmission::STATUS_PENDING,
            },
            'submitted_at' => $derived['submitted_at'],
            'approved_at' => $derived['approved_at'],
            'rejected_at' => $derived['rejected_at'],
        ]);

        $submission->notes->each(fn (Note $note) => $submission->syncSnapshotFromNote($note));
        $submission->save();

        return $submission->fresh(['groupe.filiere', 'module.filiere', 'teacher.user', 'notes.stagiaire.user']);
    }

    public function index(Request $request): JsonResponse
    {
        $professeur = $this->resolveProfessorProfile($request);

        $assignedModuleIds = $professeur->modules()->pluck('modules.id');
        $assignedGroupeIds = $professeur->groupes()->pluck('groupes.id');

        $query = Note::query()
            ->with(['stagiaire.user', 'stagiaire.groupe.filiere', 'module', 'submission'])
            ->whereIn('module_id', $assignedModuleIds)
            ->whereHas('stagiaire.groupe', fn ($query) => $query->whereIn('groupes.id', $assignedGroupeIds));

        if ($request->filled('stagiaire_id')) {
            $query->where('stagiaire_id', $request->integer('stagiaire_id'));
        }

        if ($request->filled('module_id')) {
            $query->where('module_id', $request->integer('module_id'));
        }

        if ($request->filled('status')) {
            Note::applyWorkflowStatusFilter($query, (string) $request->string('status'));
        }

        return response()->json(
            ProfessorNoteResource::collection(
                $query->orderByDesc('updated_at')->paginate(20)
            )
        );
    }

    public function storeOrUpdate(StoreNoteRequest $request): JsonResponse
    {
        $validated = $request->validated();

        return DB::transaction(function () use ($request, $validated) {
            $stagiaire = Stagiaire::query()
                ->with('groupe')
                ->findOrFail($validated['stagiaire_id']);

            $scope = $this->ensureProfessorScope($request, (int) $stagiaire->groupe_id, (int) $validated['module_id']);
            if ($scope instanceof JsonResponse) {
                return $scope;
            }

            [$professeur] = $scope;
            $submission = $this->resolveSubmissionContainer((int) $stagiaire->groupe_id, (int) $validated['module_id'], (int) $professeur->id);

            if (! $this->submissionCanBeEdited($submission)) {
                return response()->json([
                    'message' => 'Cette soumission de groupe est deja approuvee.',
                ], 422);
            }

            $note = Note::firstOrNew([
                'stagiaire_id' => $validated['stagiaire_id'],
                'module_id' => $validated['module_id'],
            ]);
            $before = $this->captureWorkflowBeforeState($note);

            $note->fill([
                'submission_id' => $submission->id,
                ...$this->buildNoteWorkflowPayload($note, $validated, Note::STATUS_DRAFT),
            ]);
            $note->save();
            $note->refresh();

            $this->persistWorkflowSnapshot($note, $submission, 'updated', $before, (int) $request->user()?->id);

            $note->load(['stagiaire.user', 'module', 'submission']);

            return response()->json([
                'message' => 'Note saved successfully.',
                'note' => new ProfessorNoteResource($note),
                'submission' => $this->summarizeSubmission($this->syncSubmissionWorkflow($submission)),
            ], 201);
        });
    }

    public function saveBatch(SaveBatchNotesRequest $request): JsonResponse
    {
        $validated = $request->validated();

        return DB::transaction(function () use ($request, $validated) {
            $scope = $this->ensureProfessorScope($request, (int) $validated['groupe_id'], (int) $validated['module_id']);
            if ($scope instanceof JsonResponse) {
                return $scope;
            }

            [$professeur] = $scope;
            $noteEntries = collect($validated['notes']);

            if ($groupValidationError = $this->validateStudentsBelongToGroup($noteEntries, (int) $validated['groupe_id'])) {
                return $groupValidationError;
            }

            $evaluationType = $this->resolveBatchEvaluationType($noteEntries, $validated['evaluation_type'] ?? null);
            $submission = $this->resolveSubmissionContainer((int) $validated['groupe_id'], (int) $validated['module_id'], (int) $professeur->id, $evaluationType);

            if (! $this->submissionCanBeEdited($submission)) {
                return response()->json([
                    'message' => 'Cette soumission de groupe est deja approuvee.',
                ], 422);
            }

            $savedNotes = [];

            foreach ($noteEntries as $noteData) {
                $note = Note::firstOrNew([
                    'stagiaire_id' => $noteData['stagiaire_id'],
                    'module_id' => $validated['module_id'],
                ]);
                $before = $this->captureWorkflowBeforeState($note);

                $note->fill([
                    'submission_id' => $submission->id,
                    ...$this->buildNoteWorkflowPayload($note, $this->mapBatchNotePayload($noteData, $evaluationType), Note::STATUS_DRAFT),
                ]);
                $note->save();
                $note->refresh();

                $this->persistWorkflowSnapshot($note, $submission, 'updated', $before, (int) $request->user()?->id);
                $savedNotes[] = $note;
            }

            $savedNotes = Note::query()
                ->with(['stagiaire.user', 'module', 'submission'])
                ->whereIn('id', collect($savedNotes)->pluck('id'))
                ->get();

            return response()->json([
                'message' => 'Notes saved successfully as drafts.',
                'count' => $savedNotes->count(),
                'notes' => ProfessorNoteResource::collection($savedNotes),
                'submission' => $this->summarizeSubmission($this->syncSubmissionWorkflow($submission)),
            ]);
        });
    }

    public function submitBatch(SubmitNotesRequest $request): JsonResponse
    {
        $validated = $request->validated();

        return DB::transaction(function () use ($request, $validated) {
            $scope = $this->ensureProfessorScope($request, (int) $validated['groupe_id'], (int) $validated['module_id']);
            if ($scope instanceof JsonResponse) {
                return $scope;
            }

            [$professeur] = $scope;
            $noteEntries = collect($validated['notes']);

            if ($groupValidationError = $this->validateStudentsBelongToGroup($noteEntries, (int) $validated['groupe_id'])) {
                return $groupValidationError;
            }

            $evaluationType = $this->normalizeEvaluationType($validated['evaluation_type'] ?? null);

            $hasAnyGrade = $noteEntries->contains(function (array $noteData): bool {
                return collect(['controle_1', 'controle_2', 'controle_3', 'efm'])
                    ->contains(fn (string $field) => array_key_exists($field, $noteData) && $noteData[$field] !== null);
            });

            if (! $hasAnyGrade) {
                return response()->json([
                    'message' => 'Au moins une note doit etre renseignee avant la soumission.',
                    'errors' => [
                        'notes' => ['Vous devez renseigner au moins une note avant de soumettre.'],
                    ],
                ], 422);
            }

            $submission = $this->resolveSubmissionContainer((int) $validated['groupe_id'], (int) $validated['module_id'], (int) $professeur->id, $evaluationType);

            if (! $this->submissionCanBeEdited($submission)) {
                return response()->json([
                    'message' => 'Cette soumission de groupe est deja approuvee.',
                ], 422);
            }

            $submission->update([
                'teacher_id' => $professeur->id,
                'status' => NoteSubmission::STATUS_PENDING,
                'submitted_at' => $submission->submitted_at ?: now(),
                'approved_at' => null,
                'rejected_at' => null,
                'admin_comment' => null,
            ]);

            $submittedNotes = [];

            foreach ($noteEntries as $noteData) {
                $note = Note::firstOrNew([
                    'stagiaire_id' => $noteData['stagiaire_id'],
                    'module_id' => $validated['module_id'],
                ]);
                $before = $this->captureWorkflowBeforeState($note);

                $note->fill([
                    'submission_id' => $submission->id,
                    ...$this->buildNoteWorkflowPayload($note, $this->mapBatchNotePayload($noteData, $evaluationType), Note::STATUS_SUBMITTED),
                ]);
                $note->save();
                $note->refresh();

                $this->persistWorkflowSnapshot($note, $submission, 'submitted', $before, (int) $request->user()?->id);
                $submittedNotes[] = $note;
            }

            $submittedNotes = Note::query()
                ->with(['stagiaire.user', 'stagiaire.groupe', 'module', 'submission'])
                ->whereIn('id', collect($submittedNotes)->pluck('id'))
                ->get();

            $this->notifyAdminsAboutSubmittedNotes();

            $submission = $this->syncSubmissionWorkflow($submission);

            if ($submission->status === NoteSubmission::STATUS_PENDING && $submission->submitted_at === null) {
                $submission->update([
                    'submitted_at' => now(),
                ]);
                $submission = $submission->fresh(['groupe.filiere', 'module.filiere', 'teacher.user', 'notes.stagiaire.user']);
            }

            return response()->json([
                'message' => 'Notes submitted successfully.',
                'count' => $submittedNotes->count(),
                'notes' => ProfessorNoteResource::collection($submittedNotes),
                'submission' => $this->summarizeSubmission($submission->fresh(['groupe.filiere', 'module.filiere', 'teacher.user', 'notes.stagiaire.user'])),
            ]);
        });
    }

    public function update(UpdateNoteRequest $request, Note $note): JsonResponse
    {
        return DB::transaction(function () use ($request, $note) {
            $note->loadMissing(['stagiaire.groupe', 'stagiaire.user', 'module', 'submission']);

            $scope = $this->ensureProfessorScope($request, (int) $note->stagiaire?->groupe_id, (int) $note->module?->id);
            if ($scope instanceof JsonResponse) {
                return $scope;
            }

            [$professeur] = $scope;

            if (! $this->submissionCanBeEdited($note->submission)) {
                return response()->json([
                    'message' => 'Cette soumission de groupe est deja approuvee.',
                ], 422);
            }

            $submission = $note->submission ?: $this->resolveSubmissionContainer(
                (int) $note->stagiaire->groupe_id,
                (int) $note->module_id,
                (int) $professeur->id
            );

            $validated = $request->validated();
            $before = $this->captureWorkflowBeforeState($note);

            $note->fill([
                'submission_id' => $submission->id,
                ...$this->buildNoteWorkflowPayload($note, $validated, Note::STATUS_DRAFT),
            ]);
            $note->save();
            $note->refresh();
            $this->persistWorkflowSnapshot($note, $submission, 'updated', $before, (int) $request->user()?->id);
            $note->load(['stagiaire.user', 'module', 'submission']);

            return response()->json([
                'message' => 'Note updated successfully.',
                'note' => new ProfessorNoteResource($note),
                'submission' => $this->summarizeSubmission($this->syncSubmissionWorkflow($submission)),
            ]);
        });
    }
}
