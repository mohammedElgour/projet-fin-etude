<?php

namespace App\Http\Controllers\Api\Professeur;

use App\Http\Controllers\Controller;
use App\Models\EmploiDuTemps;
use App\Models\Note;
use App\Models\Notification;
use App\Models\Professeur;
use App\Models\Stagiaire;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'stagiaire_id' => ['nullable', 'integer', 'exists:stagiaires,id'],
            'module_id' => ['nullable', 'integer', 'exists:modules,id'],
            'groupe_id' => ['nullable', 'integer', 'exists:groupes,id'],
            'status' => ['nullable', 'in:pending,validated,rejected'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $professeur = $request->user()->professeur;

        if (! $professeur) {
            return response()->json(['message' => 'Professeur profile not found.'], 404);
        }

        $profGroupes = $professeur->groupes()->pluck('groupes.id');
        $profModules = $professeur->modules()->pluck('modules.id');

        if (!empty($validated['groupe_id']) && ! $profGroupes->contains((int) $validated['groupe_id'])) {
            return response()->json([
                'message' => 'Unauthorized access to this groupe.',
            ], 403);
        }

        if (!empty($validated['module_id']) && ! $profModules->contains((int) $validated['module_id'])) {
            return response()->json([
                'message' => 'Unauthorized access to this module.',
            ], 403);
        }

        $query = Note::with(['stagiaire.user', 'stagiaire.groupe', 'module', 'professeur.user'])
            ->where('professeur_id', $professeur->id);

        if (!empty($validated['stagiaire_id'])) {
            $noteBelongsToTeacherScope = Stagiaire::query()
                ->whereKey($validated['stagiaire_id'])
                ->whereIn('groupe_id', $profGroupes)
                ->exists();

            if (! $noteBelongsToTeacherScope) {
                return response()->json([
                    'message' => 'Unauthorized access to this stagiaire.',
                ], 403);
            }

            $query->where('stagiaire_id', $validated['stagiaire_id']);
        }

        if (!empty($validated['module_id'])) {
            $query->where('module_id', $validated['module_id']);
        }

        if (!empty($validated['groupe_id'])) {
            $query->whereHas('stagiaire', fn ($stagiaire) => $stagiaire->where('groupe_id', $validated['groupe_id']));
        }

        if (!empty($validated['status'])) {
            $query->where('validation_status', $validated['status']);
        }

        return response()->json($query->orderByDesc('updated_at')->paginate($validated['per_page'] ?? 20));
    }

    public function storeOrUpdate(Request $request): JsonResponse
    {
        $professeur = $request->user()->professeur;

        if (! $professeur) {
            return response()->json(['message' => 'Professeur profile not found.'], 404);
        }

        $validated = $request->validate([
            'stagiaire_id' => ['required', 'exists:stagiaires,id'],
            'module_id' => ['required', 'exists:modules,id'],
            'note' => ['required', 'numeric', 'min:0', 'max:20'],
        ]);

        $stagiaire = Stagiaire::with('groupe')->findOrFail($validated['stagiaire_id']);

        if (! $this->canManageGrade($professeur, $stagiaire->groupe_id, $validated['module_id'])) {
            return response()->json([
                'message' => 'Vous n etes pas autorise a gerer cette note pour ce groupe et ce module.',
            ], 403);
        }

        $note = Note::where('stagiaire_id', $validated['stagiaire_id'])
            ->where('module_id', $validated['module_id'])
            ->first();

        if ($note && (int) $note->professeur_id !== (int) $professeur->id) {
            return response()->json([
                'message' => 'Cette note appartient a un autre professeur.',
            ], 403);
        }

        if ($note) {
            $note->update([
                'professeur_id' => $professeur->id,
                'note' => $validated['note'],
                'is_validated' => false,
                'validation_status' => 'pending',
                'feedback' => null,
                'reviewed_at' => null,
            ]);
        } else {
            $note = Note::create([
                'stagiaire_id' => $validated['stagiaire_id'],
                'module_id' => $validated['module_id'],
                'professeur_id' => $professeur->id,
                'note' => $validated['note'],
                'is_validated' => false,
                'validation_status' => 'pending',
                'feedback' => null,
                'reviewed_at' => null,
            ]);
        }

        $note->load(['stagiaire.user', 'stagiaire.groupe', 'module', 'professeur.user']);

        if ($note->stagiaire && $note->stagiaire->user) {
            Notification::create([
                'user_id' => $note->stagiaire->user->id,
                'title' => 'Mise a jour de note',
                'type' => 'grade',
                'role' => 'stagiaire',
                'message' => "Une nouvelle note a ete ajoutee ou modifiee pour le module {$note->module->nom}.",
                'is_read' => false,
            ]);
        }

        return response()->json([
            'message' => 'Note saved successfully. Validation pending.',
            'note' => $note,
        ], 201);
    }

    public function update(Request $request, Note $note): JsonResponse
    {
        $professeur = $request->user()->professeur;

        if (! $professeur) {
            return response()->json(['message' => 'Professeur profile not found.'], 404);
        }

        $note->loadMissing(['stagiaire.groupe', 'module']);

        if ((int) $note->professeur_id !== (int) $professeur->id) {
            return response()->json([
                'message' => 'Cette note appartient a un autre professeur.',
            ], 403);
        }

        if ($note->validation_status === 'validated') {
            return response()->json([
                'message' => 'Validated notes cannot be edited.',
            ], 422);
        }

        if (! $this->canManageGrade($professeur, $note->stagiaire->groupe_id, $note->module_id)) {
            return response()->json([
                'message' => 'Vous n etes pas autorise a modifier cette note pour ce groupe et ce module.',
            ], 403);
        }

        $validated = $request->validate([
            'note' => ['required', 'numeric', 'min:0', 'max:20'],
        ]);

        $note->update([
            'professeur_id' => $professeur->id,
            'note' => $validated['note'],
            'is_validated' => false,
            'validation_status' => 'pending',
            'feedback' => null,
            'reviewed_at' => null,
        ]);
        $note->load(['stagiaire.user', 'stagiaire.groupe', 'module', 'professeur.user']);

        if ($note->stagiaire && $note->stagiaire->user) {
            Notification::create([
                'user_id' => $note->stagiaire->user->id,
                'title' => 'Note modifiee',
                'type' => 'grade',
                'role' => 'stagiaire',
                'message' => "Votre note du module {$note->module->nom} a ete mise a jour.",
                'is_read' => false,
            ]);
        }

        return response()->json([
            'message' => 'Note updated successfully.',
            'note' => $note,
        ]);
    }

    private function canManageGrade(Professeur $professeur, int $groupeId, int $moduleId): bool
    {
        return EmploiDuTemps::query()
            ->where('professeur_id', $professeur->id)
            ->where('groupe_id', $groupeId)
            ->where('module_id', $moduleId)
            ->exists();
    }
}
