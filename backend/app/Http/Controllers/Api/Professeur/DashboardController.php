<?php

namespace App\Http\Controllers\Api\Professeur;

use App\Http\Controllers\Controller;
use App\Models\Filier;
use App\Models\Note;
use App\Models\Stagiaire;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $professeur = $request->user()->professeur;

        if (! $professeur) {
            return response()->json(['message' => 'Professeur profile not found.'], 404);
        }

        $groupeIds = $professeur->groupes()->pluck('groupes.id')->unique()->values();
        $filiereIds = $professeur->groupes()->pluck('groupes.filiere_id')->unique()->values();

        $students = Stagiaire::query()->whereIn('groupe_id', $groupeIds);
        $notes = Note::query()->where('professeur_id', $professeur->id);

        $averageGrade = (float) ((clone $notes)->avg('note') ?? 0);

        return response()->json([
            'kpis' => [
                'filieres' => Filier::query()->whereIn('id', $filiereIds)->count(),
                'groupes' => $groupeIds->count(),
                'students' => $students->count(),
                'notes' => (clone $notes)->count(),
                'pending_notes' => (clone $notes)->where('validation_status', 'pending')->count(),
                'average_grade' => round($averageGrade, 2),
            ],
        ]);
    }
}
