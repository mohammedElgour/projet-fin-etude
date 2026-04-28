<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Filier;
use App\Models\Groupe;
use App\Models\Note;
use App\Models\Professeur;
use App\Models\Stagiaire;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $totalStagiaires = Stagiaire::count();
        $totalProfesseurs = Professeur::count();
        $totalFilieres = Filier::count();
        $totalGroupes = Groupe::count();
        $totalNotes = Note::count();

        $validatedNotes = Note::where('is_validated', true)->count();
        $successCount = Note::where('is_validated', true)->where('note', '>=', 10)->count();
        $successRate = $validatedNotes > 0 ? round(($successCount / $validatedNotes) * 100, 2) : 0;

        $performanceByFiliere = Note::query()
            ->join('stagiaires', 'notes.stagiaire_id', '=', 'stagiaires.id')
            ->join('groupes', 'stagiaires.groupe_id', '=', 'groupes.id')
            ->join('filiers', 'groupes.filiere_id', '=', 'filiers.id')
            ->select('filiers.id', 'filiers.nom', DB::raw('ROUND(AVG(notes.note), 2) as average_note'))
            ->groupBy('filiers.id', 'filiers.nom')
            ->orderBy('filiers.nom')
            ->get();

        $evolution = Note::query()
            ->select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as period"),
                DB::raw('ROUND(AVG(note), 2) as average_note'),
                DB::raw('COUNT(*) as total_notes')
            )
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        return response()->json([
            'kpis' => [
                'stagiaires' => $totalStagiaires,
                'professeurs' => $totalProfesseurs,
                'filieres' => $totalFilieres,
                'groupes' => $totalGroupes,
                'notes' => $totalNotes,
                'validated_notes' => $validatedNotes,
                'success_rate' => $successRate,
            ],
            'charts' => [
                'performance_by_filiere' => $performanceByFiliere,
                'results_evolution' => $evolution,
            ],
        ]);
    }
}
