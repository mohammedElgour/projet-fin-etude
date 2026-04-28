<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Note;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NoteValidationController extends Controller
{
    public function indexPending(): JsonResponse
    {
        $notes = Note::with(['stagiaire.user', 'module'])
            ->where('is_validated', false)
            ->paginate(20);

        return response()->json($notes);
    }

    public function validateNote(Note $note): JsonResponse
    {
        if ($note->is_validated) {
            return response()->json([
                'message' => 'Note already validated.',
                'note' => $note->load(['stagiaire.user', 'module']),
            ]);
        }

        $note->update(['is_validated' => true]);
        $note->load(['stagiaire.user', 'module']);

        $stagiaireUser = optional($note->stagiaire)->user;
        if ($stagiaireUser) {
            Notification::create([
                'user_id' => $stagiaireUser->id,
                'message' => "Votre note du module {$note->module->nom} a été validée.",
                'is_read' => false,
            ]);
        }

        return response()->json([
            'message' => 'Note validated successfully.',
            'note' => $note,
        ]);
    }
}
