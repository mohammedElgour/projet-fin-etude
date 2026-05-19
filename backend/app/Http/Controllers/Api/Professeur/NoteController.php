<?php

namespace App\Http\Controllers\Api\Professeur;

use App\Http\Controllers\Api\Professeur\Concerns\ResolvesProfessorScope;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Professeur\StoreNoteRequest;
use App\Http\Requests\Api\Professeur\UpdateNoteRequest;
use App\Http\Resources\Professeur\ProfessorNoteResource;
use App\Models\Module;
use App\Models\Note;
use App\Models\Notification;
use App\Models\Stagiaire;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;


class NoteController extends Controller
{
    use ResolvesProfessorScope;

    protected function calculateAverage(array $validated): float
    {
        return round(((
            (float) ($validated['cc1'] ?? 0) +
            (float) ($validated['cc2'] ?? 0) +
            (float) ($validated['cc3'] ?? 0) +
            ((float) ($validated['efm'] ?? 0) * 2)
        ) / 5), 2);
    }

    public function index(Request $request): JsonResponse
    {

        $professeur = $this->resolveProfessorProfile($request);



        $assignedModuleIds = $professeur->modules()->pluck('modules.id');


        $assignedGroupeIds = $professeur->groupes()->pluck('groupes.id');

        $query = Note::query()
            ->with(['stagiaire.user', 'stagiaire.groupe.filiere', 'module'])
            ->whereIn('module_id', $assignedModuleIds)
            ->whereHas('stagiaire.groupe', fn ($query) => $query->whereIn('groupes.id', $assignedGroupeIds));


        if ($request->filled('stagiaire_id')) {
            $query->where('stagiaire_id', $request->integer('stagiaire_id'));
        }

        if ($request->filled('module_id')) {
            $query->where('module_id', $request->integer('module_id'));
        }

        if ($request->filled('status')) {
            $query->where('validation_status', $request->string('status'));
        }

        return response()->json(
            ProfessorNoteResource::collection(
                $query->orderByDesc('updated_at')->paginate(20)
            )
        );
    }

    public function storeOrUpdate(StoreNoteRequest $request): JsonResponse
    {
        $professeur = $this->resolveProfessorProfile($request);
        $validated = $request->validated();

        $stagiaire = Stagiaire::query()
            ->with('groupe')
            ->findOrFail($validated['stagiaire_id']);

        $module = Module::query()->findOrFail($validated['module_id']);

        $professeur->loadMissing(['modules', 'groupes']);

        $isModuleAssigned = $professeur->modules->contains(fn ($m) => (int) $m->id === (int) $module->id);
        $isGroupeAssigned = $professeur->groupes->contains(fn ($g) => (int) $g->id === (int) $stagiaire->groupe_id);

        if (!$isModuleAssigned || !$isGroupeAssigned) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }


        $note = Note::updateOrCreate(
            [
                'stagiaire_id' => $validated['stagiaire_id'],
                'module_id' => $validated['module_id'],
            ],
            [
                'cc1' => $validated['cc1'] ?? null,
                'cc2' => $validated['cc2'] ?? null,
                'cc3' => $validated['cc3'] ?? null,
                'efm' => $validated['efm'] ?? null,
                'note' => $this->calculateAverage($validated),
                'is_validated' => false,
                'validation_status' => 'pending',
                'feedback' => null,
                'reviewed_at' => null,
            ]
        );

        $note->load(['stagiaire.user', 'module']);

        if ($note->stagiaire && $note->stagiaire->user) {
            Notification::create([
                'user_id' => $note->stagiaire->user->id,
                'message' => "Une nouvelle note a ete ajoutee ou modifiee pour le module {$note->module->nom}.",
                'is_read' => false,
            ]);
        }

        return response()->json([
            'message' => 'Note saved successfully. Validation pending.',
            'note' => new ProfessorNoteResource($note),
        ], 201);
    }

    public function update(UpdateNoteRequest $request, Note $note): JsonResponse
    {
        $professeur = $this->resolveProfessorProfile($request);
        $note->loadMissing(['stagiaire.groupe', 'stagiaire.user', 'module']);

        $professeur->loadMissing(['modules', 'groupes']);

        $isModuleAssigned = $professeur->modules->contains(fn ($m) => (int) $m->id === (int) $note->module?->id);
        $isGroupeAssigned = $professeur->groupes->contains(fn ($g) => (int) $g->id === (int) $note->stagiaire?->groupe_id);

        if (!$isModuleAssigned || !$isGroupeAssigned) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }


        if ($note->validation_status === 'validated') {
            return response()->json([
                'message' => 'Validated notes cannot be edited.',
            ], 422);
        }

        $validated = $request->validated();

        $note->update([
            'cc1' => $validated['cc1'] ?? null,
            'cc2' => $validated['cc2'] ?? null,
            'cc3' => $validated['cc3'] ?? null,
            'efm' => $validated['efm'] ?? null,
            'note' => $this->calculateAverage($validated),
            'is_validated' => false,
            'validation_status' => 'pending',
            'feedback' => null,
            'reviewed_at' => null,
        ]);
        $note->load(['stagiaire.user', 'module']);

        if ($note->stagiaire && $note->stagiaire->user) {
            Notification::create([
                'user_id' => $note->stagiaire->user->id,
                'message' => "Votre note du module {$note->module->nom} a ete mise a jour.",
                'is_read' => false,
            ]);
        }

        return response()->json([
            'message' => 'Note updated successfully.',
            'note' => new ProfessorNoteResource($note),
        ]);
    }
}
