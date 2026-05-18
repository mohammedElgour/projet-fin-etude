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

    public function index(Request $request): JsonResponse
    {
        $professeur = $this->resolveProfessorProfile($request);
        $filiereId = $this->resolveProfessorFiliereId($professeur);

        if (!$filiereId) {
            return response()->json(
                ProfessorNoteResource::collection(
                    Note::query()->whereRaw('1 = 0')->paginate(20)
                )
            );
        }

        $query = Note::query()
            ->with(['stagiaire.user', 'stagiaire.groupe.filiere', 'module'])
            ->whereHas('module', fn ($query) => $query->where('filiere_id', $filiereId))
            ->whereHas('stagiaire.groupe', fn ($query) => $query->where('filiere_id', $filiereId));

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
        $filiereId = $this->resolveProfessorFiliereId($professeur);

        if (
            !$filiereId
            || (int) $stagiaire->groupe?->filiere_id !== $filiereId
            || (int) $module->filiere_id !== $filiereId
        ) {
            return response()->json([
                'message' => 'Vous ne pouvez saisir des notes que pour votre filiere.',
            ], 403);
        }

        $note = Note::updateOrCreate(
            [
                'stagiaire_id' => $validated['stagiaire_id'],
                'module_id' => $validated['module_id'],
            ],
            [
                'note' => $validated['note'],
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
        $filiereId = $this->resolveProfessorFiliereId($professeur);

        $note->loadMissing(['stagiaire.groupe', 'stagiaire.user', 'module']);

        if (
            !$filiereId
            || (int) $note->module?->filiere_id !== $filiereId
            || (int) $note->stagiaire?->groupe?->filiere_id !== $filiereId
        ) {
            return response()->json([
                'message' => 'Vous ne pouvez modifier que les notes de votre filiere.',
            ], 403);
        }

        if ($note->validation_status === 'validated') {
            return response()->json([
                'message' => 'Validated notes cannot be edited.',
            ], 422);
        }

        $validated = $request->validated();

        $note->update([
            'note' => $validated['note'],
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
