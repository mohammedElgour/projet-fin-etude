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
use App\Models\Notification;
use App\Models\Stagiaire;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class NoteController extends Controller
{
    use ResolvesProfessorScope;

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

    protected function mapBatchNotePayload(array $noteData): array
    {
        return [
            'cc1' => $noteData['controle_1'] ?? null,
            'cc2' => $noteData['controle_2'] ?? null,
            'cc3' => $noteData['controle_3'] ?? null,
            'efm' => $noteData['efm'] ?? null,
        ];
    }

    protected function buildWorkflowPayload(array $grades, string $status, ?string $feedback = null): array
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

    protected function professorCanEditStatus(Note $note): bool
    {
        return in_array($note->workflowStatus(), [Note::STATUS_DRAFT, Note::STATUS_REJECTED], true);
    }

    protected function submissionCanBeEdited(?NoteSubmission $submission): bool
    {
        if (!$submission) {
            return true;
        }

        if ($submission->submitted_at === null) {
            return true;
        }

        return $submission->status === NoteSubmission::STATUS_REJECTED;
    }

    protected function resolveSubmissionContainer(int $groupeId, int $moduleId, int $teacherId): NoteSubmission
    {
        $submission = NoteSubmission::query()->firstOrCreate(
            [
                'groupe_id' => $groupeId,
                'module_id' => $moduleId,
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

    protected function ensureProfessorScope(Request $request, int $groupeId, int $moduleId): JsonResponse|array
    {
        $professeur = $this->resolveProfessorProfile($request);
        $professeur->loadMissing(['modules', 'groupes']);

        $isModuleAssigned = $professeur->modules->contains(fn ($module) => (int) $module->id === $moduleId);
        $isGroupeAssigned = $professeur->groupes->contains(fn ($groupe) => (int) $groupe->id === $groupeId);

        if (!$isModuleAssigned || !$isGroupeAssigned) {
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

    protected function validateCompleteSubmission(Collection $noteEntries, int $groupeId): ?JsonResponse
    {
        $groupStudentIds = $this->collectGroupStudentIds($groupeId);
        $submittedStudentIds = $noteEntries->pluck('stagiaire_id')
            ->map(fn ($id) => (int) $id)
            ->sort()
            ->values();

        if ($submittedStudentIds->count() !== $groupStudentIds->count() || $submittedStudentIds->diff($groupStudentIds)->isNotEmpty()) {
            return response()->json([
                'message' => 'Vous devez soumettre les notes de tous les stagiaires du groupe.',
                'errors' => [
                    'notes' => ['La soumission doit couvrir tous les stagiaires du groupe selectionne.'],
                ],
            ], 422);
        }

        $hasMissingGrades = $noteEntries->contains(function (array $noteData) {
            foreach (['controle_1', 'controle_2', 'controle_3', 'efm'] as $field) {
                if (!array_key_exists($field, $noteData) || $noteData[$field] === null) {
                    return true;
                }
            }

            return false;
        });

        if ($hasMissingGrades) {
            return response()->json([
                'message' => 'Toutes les notes doivent etre renseignees avant la soumission du groupe.',
                'errors' => [
                    'notes' => ['Chaque stagiaire doit avoir ses 4 notes avant la soumission.'],
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
                Notification::create([
                    'user_id' => $note->stagiaire->user->id,
                    'message' => str_replace(':module', $note->module->nom, $messageTemplate),
                    'is_read' => false,
                ]);
            }
        }
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

        $stagiaire = Stagiaire::query()
            ->with('groupe')
            ->findOrFail($validated['stagiaire_id']);

        $scope = $this->ensureProfessorScope($request, (int) $stagiaire->groupe_id, (int) $validated['module_id']);
        if ($scope instanceof JsonResponse) {
            return $scope;
        }

        [$professeur] = $scope;
        $submission = $this->resolveSubmissionContainer((int) $stagiaire->groupe_id, (int) $validated['module_id'], (int) $professeur->id);

        if (!$this->submissionCanBeEdited($submission)) {
            return response()->json([
                'message' => 'Cette soumission de groupe est deja en cours de validation ou approuvee.',
            ], 422);
        }

        $note = Note::updateOrCreate(
            [
                'stagiaire_id' => $validated['stagiaire_id'],
                'module_id' => $validated['module_id'],
            ],
            [
                'submission_id' => $submission->id,
                ...$this->buildWorkflowPayload($validated, Note::STATUS_DRAFT),
            ]
        );

        $note->load(['stagiaire.user', 'module', 'submission']);

        return response()->json([
            'message' => 'Note saved successfully.',
            'note' => new ProfessorNoteResource($note),
            'submission' => $this->summarizeSubmission($submission),
        ], 201);
    }

    public function saveBatch(SaveBatchNotesRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $scope = $this->ensureProfessorScope($request, (int) $validated['groupe_id'], (int) $validated['module_id']);
        if ($scope instanceof JsonResponse) {
            return $scope;
        }

        [$professeur] = $scope;
        $noteEntries = collect($validated['notes']);

        if ($groupValidationError = $this->validateStudentsBelongToGroup($noteEntries, (int) $validated['groupe_id'])) {
            return $groupValidationError;
        }

        $submission = $this->resolveSubmissionContainer((int) $validated['groupe_id'], (int) $validated['module_id'], (int) $professeur->id);

        if (!$this->submissionCanBeEdited($submission)) {
            return response()->json([
                'message' => 'Cette soumission de groupe est deja en cours de validation ou approuvee.',
            ], 422);
        }

        $savedNotes = DB::transaction(function () use ($noteEntries, $validated, $submission) {
            $savedNoteIds = [];

            foreach ($noteEntries as $noteData) {
                $note = Note::updateOrCreate(
                    [
                        'stagiaire_id' => $noteData['stagiaire_id'],
                        'module_id' => $validated['module_id'],
                    ],
                    [
                        'submission_id' => $submission->id,
                        ...$this->buildWorkflowPayload($this->mapBatchNotePayload($noteData), Note::STATUS_DRAFT),
                    ]
                );

                $savedNoteIds[] = $note->id;
            }

            return Note::query()
                ->with(['stagiaire.user', 'module', 'submission'])
                ->whereIn('id', $savedNoteIds)
                ->get();
        });

        $this->notifyStudents($savedNotes, 'Les notes du module :module ont ete mises a jour.');

        return response()->json([
            'message' => 'Notes saved successfully as drafts.',
            'count' => $savedNotes->count(),
            'notes' => ProfessorNoteResource::collection($savedNotes),
            'submission' => $this->summarizeSubmission($submission),
        ]);
    }

    public function submitBatch(SubmitNotesRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $scope = $this->ensureProfessorScope($request, (int) $validated['groupe_id'], (int) $validated['module_id']);
        if ($scope instanceof JsonResponse) {
            return $scope;
        }

        [$professeur] = $scope;
        $noteEntries = collect($validated['notes']);

        if ($groupValidationError = $this->validateStudentsBelongToGroup($noteEntries, (int) $validated['groupe_id'])) {
            return $groupValidationError;
        }

        if ($submissionValidationError = $this->validateCompleteSubmission($noteEntries, (int) $validated['groupe_id'])) {
            return $submissionValidationError;
        }

        $submission = $this->resolveSubmissionContainer((int) $validated['groupe_id'], (int) $validated['module_id'], (int) $professeur->id);

        if (!$this->submissionCanBeEdited($submission)) {
            return response()->json([
                'message' => 'Cette soumission de groupe est deja en cours de validation ou approuvee.',
            ], 422);
        }

        $submittedNotes = DB::transaction(function () use ($noteEntries, $validated, $submission, $professeur) {
            $submission->update([
                'teacher_id' => $professeur->id,
                'status' => NoteSubmission::STATUS_PENDING,
                'submitted_at' => now(),
                'approved_at' => null,
                'rejected_at' => null,
                'admin_comment' => null,
            ]);

            $savedNoteIds = [];

            foreach ($noteEntries as $noteData) {
                $note = Note::updateOrCreate(
                    [
                        'stagiaire_id' => $noteData['stagiaire_id'],
                        'module_id' => $validated['module_id'],
                    ],
                    [
                        'submission_id' => $submission->id,
                        ...$this->buildWorkflowPayload($this->mapBatchNotePayload($noteData), Note::STATUS_SUBMITTED),
                    ]
                );

                $savedNoteIds[] = $note->id;
            }

            return Note::query()
                ->with(['stagiaire.user', 'stagiaire.groupe', 'module', 'submission'])
                ->whereIn('id', $savedNoteIds)
                ->get();
        });

        $this->notifyStudents($submittedNotes, 'Les notes du module :module ont ete soumises pour validation.');

        return response()->json([
            'message' => 'Notes submitted successfully.',
            'count' => $submittedNotes->count(),
            'notes' => ProfessorNoteResource::collection($submittedNotes),
            'submission' => $this->summarizeSubmission($submission->fresh() ?? $submission),
        ]);
    }

    public function update(UpdateNoteRequest $request, Note $note): JsonResponse
    {
        $note->loadMissing(['stagiaire.groupe', 'stagiaire.user', 'module', 'submission']);

        $scope = $this->ensureProfessorScope($request, (int) $note->stagiaire?->groupe_id, (int) $note->module?->id);
        if ($scope instanceof JsonResponse) {
            return $scope;
        }

        [$professeur] = $scope;

        if (!$this->professorCanEditStatus($note) || !$this->submissionCanBeEdited($note->submission)) {
            return response()->json([
                'message' => 'Submitted or validated notes cannot be edited until they are rejected.',
            ], 422);
        }

        $submission = $note->submission ?: $this->resolveSubmissionContainer(
            (int) $note->stagiaire->groupe_id,
            (int) $note->module_id,
            (int) $professeur->id
        );

        $validated = $request->validated();

        $note->update([
            'submission_id' => $submission->id,
            ...$this->buildWorkflowPayload($validated, Note::STATUS_DRAFT),
        ]);

        $note->load(['stagiaire.user', 'module', 'submission']);

        return response()->json([
            'message' => 'Note updated successfully.',
            'note' => new ProfessorNoteResource($note),
            'submission' => $this->summarizeSubmission($submission),
        ]);
    }
}
