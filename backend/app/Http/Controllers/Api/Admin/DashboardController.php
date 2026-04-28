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

        $validatedNotes = Note::where('validation_status', 'validated')->count();
        $pendingNotes = Note::where('validation_status', 'pending')->count();
        $rejectedNotes = Note::where('validation_status', 'rejected')->count();
        $successCount = Note::where('validation_status', 'validated')->where('note', '>=', 10)->count();
        $averageGrade = (float) (Note::where('validation_status', 'validated')->avg('note') ?? 0);
        $successRate = $validatedNotes > 0 ? round(($successCount / $validatedNotes) * 100, 2) : 0;
        $failRate = $validatedNotes > 0 ? round(100 - $successRate, 2) : 0;

        $performanceByFiliere = Note::query()
            ->join('stagiaires', 'notes.stagiaire_id', '=', 'stagiaires.id')
            ->join('groupes', 'stagiaires.groupe_id', '=', 'groupes.id')
            ->join('filiers', 'groupes.filiere_id', '=', 'filiers.id')
            ->select('filiers.id', 'filiers.nom', DB::raw('ROUND(AVG(notes.note), 2) as average_note'))
            ->where('notes.validation_status', 'validated')
            ->groupBy('filiers.id', 'filiers.nom')
            ->orderBy('filiers.nom')
            ->get();

        $lowestModules = Note::query()
            ->join('modules', 'notes.module_id', '=', 'modules.id')
            ->select('modules.id', 'modules.nom', DB::raw('ROUND(AVG(notes.note), 2) as average_note'))
            ->where('notes.validation_status', 'validated')
            ->groupBy('modules.id', 'modules.nom')
            ->orderBy('average_note')
            ->limit(5)
            ->get();

        $topStudents = Note::query()
            ->join('stagiaires', 'notes.stagiaire_id', '=', 'stagiaires.id')
            ->join('users', 'stagiaires.user_id', '=', 'users.id')
            ->select('stagiaires.id', 'users.name', DB::raw('ROUND(AVG(notes.note), 2) as average_note'))
            ->where('notes.validation_status', 'validated')
            ->groupBy('stagiaires.id', 'users.name')
            ->orderByDesc('average_note')
            ->limit(5)
            ->get();

        $evolution = Note::query()
            ->select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as period"),
                DB::raw('ROUND(AVG(note), 2) as average_note'),
                DB::raw('COUNT(*) as total_notes')
            )
            ->where('validation_status', 'validated')
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
                'pending_notes' => $pendingNotes,
                'rejected_notes' => $rejectedNotes,
                'average_grade' => round($averageGrade, 2),
                'success_rate' => $successRate,
                'fail_rate' => $failRate,
            ],
            'charts' => [
                'performance_by_filiere' => $performanceByFiliere,
                'results_evolution' => $evolution,
                'lowest_modules' => $lowestModules,
                'top_students' => $topStudents,
            ],
        ]);
    }
}
