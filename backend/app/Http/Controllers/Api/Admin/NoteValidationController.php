<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Note;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NoteValidationController extends Controller
{
    public function indexPending(): JsonResponse
    {
        $notes = Note::with(['stagiaire.user', 'module'])
            ->where('validation_status', 'pending')
            ->paginate(20);

        return response()->json($notes);
    }

    public function validateNote(Note $note): JsonResponse
    {
        if ($note->validation_status === 'validated') {
            return response()->json([
                'message' => 'Note already validated.',
                'note' => $note->load(['stagiaire.user', 'module']),
            ]);
        }

        $note->update([
            'is_validated' => true,
            'validation_status' => 'validated',
            'feedback' => null,
            'reviewed_at' => now(),
        ]);
        $note->load(['stagiaire.user', 'module']);

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
            'note' => $note,
        ]);
    }

    public function rejectNote(Request $request, Note $note): JsonResponse
    {
        $validated = $request->validate([
            'feedback' => ['nullable', 'string', 'max:1000'],
        ]);

        $note->update([
            'is_validated' => false,
            'validation_status' => 'rejected',
            'feedback' => $validated['feedback'] ?? 'Veuillez revoir cette note.',
            'reviewed_at' => now(),
        ]);
        $note->load(['stagiaire.user', 'module']);

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
            'note' => $note,
        ]);
    }
}
