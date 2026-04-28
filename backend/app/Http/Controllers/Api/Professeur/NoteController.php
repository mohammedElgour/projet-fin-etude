<?php

namespace App\Http\Controllers\Api\Professeur;

use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Models\Note;
use App\Models\Notification;
use App\Models\Stagiaire;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Note::with(['stagiaire.user', 'module']);

        if ($request->filled('stagiaire_id')) {
            $query->where('stagiaire_id', $request->integer('stagiaire_id'));
        }

        if ($request->filled('module_id')) {
            $query->where('module_id', $request->integer('module_id'));
        }

        return response()->json($query->paginate(20));
    }

    public function storeOrUpdate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'stagiaire_id' => ['required', 'exists:stagiaires,id'],
            'module_id' => ['required', 'exists:modules,id'],
            'note' => ['required', 'numeric', 'min:0', 'max:20'],
        ]);

        $note = Note::updateOrCreate(
            [
                'stagiaire_id' => $validated['stagiaire_id'],
                'module_id' => $validated['module_id'],
            ],
            [
                'note' => $validated['note'],
                'is_validated' => false,
            ]
        );

        $note->load(['stagiaire.user', 'module']);

        if ($note->stagiaire && $note->stagiaire->user) {
            Notification::create([
                'user_id' => $note->stagiaire->user->id,
                'message' => "Une nouvelle note a été ajoutée/modifiée pour le module {$note->module->nom}.",
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
        if ($note->is_validated) {
            return response()->json([
                'message' => 'Validated notes cannot be edited.',
            ], 422);
        }

        $validated = $request->validate([
            'note' => ['required', 'numeric', 'min:0', 'max:20'],
        ]);

        $note->update(['note' => $validated['note']]);
        $note->load(['stagiaire.user', 'module']);

        if ($note->stagiaire && $note->stagiaire->user) {
            Notification::create([
                'user_id' => $note->stagiaire->user->id,
                'message' => "Votre note du module {$note->module->nom} a été mise à jour.",
                'is_read' => false,
            ]);
        }

        return response()->json([
            'message' => 'Note updated successfully.',
            'note' => $note,
        ]);
    }
}
