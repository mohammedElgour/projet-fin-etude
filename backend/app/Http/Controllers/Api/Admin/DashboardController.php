<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Filier;
use App\Models\Groupe;
use App\Models\Module;
use App\Models\Note;
use App\Models\Professeur;
use App\Models\Stagiaire;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $periodExpression = "DATE_FORMAT(COALESCE(reviewed_at, created_at), '%Y-%m')";
        $monthExpression = "DATE_FORMAT(COALESCE(reviewed_at, created_at), '%b')";

        $totalStagiaires = Stagiaire::count();
        $totalProfesseurs = Professeur::count();
        $totalModules = Module::count();
        $totalFilieres = Filier::count();
        $totalGroupes = Groupe::count();

        $validatedNotesQuery = Note::query()->where('validation_status', 'validated');
        $validatedNotes = (clone $validatedNotesQuery)->count();
        $pendingNotes = Note::where('validation_status', 'pending')->count();
        $rejectedNotes = Note::where('validation_status', 'rejected')->count();
        $averageGrade = (float) ((clone $validatedNotesQuery)->avg('note') ?? 0);

        $studentAverages = Note::query()
            ->join('stagiaires', 'notes.stagiaire_id', '=', 'stagiaires.id')
            ->join('users', 'stagiaires.user_id', '=', 'users.id')
            ->select(
                'stagiaires.id',
                'users.name',
                DB::raw('ROUND(AVG(notes.note), 2) as average_note')
            )
            ->where('notes.validation_status', 'validated')
            ->groupBy('stagiaires.id', 'users.name');

        $studentAveragesCollection = (clone $studentAverages)->get();
        $studentsWithValidatedNotes = $studentAveragesCollection->count();
        $successCount = $studentAveragesCollection->filter(
            fn ($student) => (float) $student->average_note >= 10
        )->count();
        $successRate = $studentsWithValidatedNotes > 0 ? round(($successCount / $studentsWithValidatedNotes) * 100, 2) : 0;
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

        $modulePerformance = Note::query()
            ->join('modules', 'notes.module_id', '=', 'modules.id')
            ->select('modules.id', 'modules.nom as module', DB::raw('ROUND(AVG(notes.note), 2) as average'))
            ->where('notes.validation_status', 'validated')
            ->groupBy('modules.id', 'modules.nom')
            ->orderByDesc('average')
            ->get();

        $lowestModules = $modulePerformance
            ->sortBy('average')
            ->take(5)
            ->values()
            ->map(fn ($module) => [
                'id' => $module->id,
                'module' => $module->module,
                'average' => (float) $module->average,
            ]);

        $topStudents = (clone $studentAverages)
            ->orderByDesc('average_note')
            ->limit(5)
            ->get()
            ->map(fn ($student) => [
                'id' => $student->id,
                'name' => $student->name,
                'average' => (float) $student->average_note,
            ]);

        $performanceTrend = Note::query()
            ->select(
                DB::raw("$periodExpression as period"),
                DB::raw("$monthExpression as month"),
                DB::raw('ROUND(AVG(note), 2) as average')
            )
            ->where('validation_status', 'validated')
            ->groupBy(DB::raw($periodExpression), DB::raw($monthExpression))
            ->orderBy(DB::raw($periodExpression), 'asc')
            ->get()
            ->map(fn ($row) => [
                'month' => $row->month,
                'average' => (float) $row->average,
            ]);

        $gradeDistribution = [
            'A' => Note::where('validation_status', 'validated')->where('note', '>=', 16)->count(),
            'B' => Note::where('validation_status', 'validated')->whereBetween('note', [14, 15.99])->count(),
            'C' => Note::where('validation_status', 'validated')->whereBetween('note', [12, 13.99])->count(),
            'D' => Note::where('validation_status', 'validated')->whereBetween('note', [10, 11.99])->count(),
            'F' => Note::where('validation_status', 'validated')->where('note', '<', 10)->count(),
        ];

        $modulePerformancePayload = $modulePerformance->map(fn ($module) => [
            'id' => $module->id,
            'module' => $module->module,
            'average' => (float) $module->average,
        ])->values();

        return response()->json([
            'total_students' => $totalStagiaires,
            'total_professors' => $totalProfesseurs,
            'total_modules' => $totalModules,
            'success_rate' => $successRate,
            'performance_trend' => $performanceTrend,
            'grade_distribution' => $gradeDistribution,
            'module_performance' => $modulePerformancePayload,
            'top_students' => $topStudents,
            'difficult_modules' => $lowestModules,
            'kpis' => [
                'total_students' => $totalStagiaires,
                'total_professors' => $totalProfesseurs,
                'total_modules' => $totalModules,
                'filieres' => $totalFilieres,
                'groupes' => $totalGroupes,
                'validated_notes' => $validatedNotes,
                'pending_notes' => $pendingNotes,
                'rejected_notes' => $rejectedNotes,
                'average_grade' => round($averageGrade, 2),
                'success_rate' => $successRate,
                'fail_rate' => $failRate,
            ],
            'charts' => [
                'performance_by_filiere' => $performanceByFiliere,
                'results_evolution' => $performanceTrend,
                'grade_distribution' => $gradeDistribution,
                'module_performance' => $modulePerformancePayload,
                'lowest_modules' => $lowestModules,
                'top_students' => $topStudents,
            ],
        ]);
    }
}
