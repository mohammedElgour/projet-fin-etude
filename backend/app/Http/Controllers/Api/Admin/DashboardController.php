<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Filier;
use App\Models\Groupe;
use App\Models\Module;
use App\Models\Note;
use App\Models\Professeur;
use App\Models\Stagiaire;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $totalStagiaires = Stagiaire::count();
        $totalProfesseurs = Professeur::count();
        $totalFilieres = Filier::count();
        $totalGroupes = Groupe::count();
        $totalModules = Module::count();
        $totalNotes = Note::count();

        $validatedNotes = Note::where('validation_status', 'validated')->count();
        $pendingNotes = Note::where('validation_status', 'pending')->count();
        $rejectedNotes = Note::where('validation_status', 'rejected')->count();
        $successCount = Note::where('validation_status', 'validated')->where('note', '>=', 10)->count();
        $averageGrade = (float) (Note::where('validation_status', 'validated')->avg('note') ?? 0);
        $successRate = $validatedNotes > 0 ? round(($successCount / $validatedNotes) * 100, 2) : 0;
        $failRate = $validatedNotes > 0 ? round(100 - $successRate, 2) : 0;

        $groupesPerFiliere = Filier::query()
            ->withCount(['groupes', 'modules'])
            ->orderBy('nom')
            ->get(['id', 'nom'])
            ->map(fn (Filier $filiere) => [
                'id' => $filiere->id,
                'nom' => $filiere->nom,
                'groupes_count' => (int) $filiere->groupes_count,
                'modules_count' => (int) $filiere->modules_count,
            ]);

        $stagiairesPerGroupe = Groupe::query()
            ->with(['filier:id,nom'])
            ->withCount('stagiaires')
            ->get();

        $stagiairesPerGroupe = $stagiairesPerGroupe
            ->sortBy(fn (Groupe $groupe) => [
                strtolower($groupe->filier?->nom ?? ''),
                strtolower($groupe->nom),
                $groupe->id,
            ])
            ->values()
            ->map(fn (Groupe $groupe) => [
                'id' => $groupe->id,
                'nom' => $groupe->nom,
                'filiere_id' => $groupe->filiere_id,
                'filiere_nom' => $groupe->filier?->nom,
                'stagiaires_count' => (int) $groupe->stagiaires_count,
            ]);

        $modulesDistribution = Filier::query()
            ->withCount('modules')
            ->orderBy('nom')
            ->get(['id', 'nom'])
            ->map(fn (Filier $filiere) => [
                'id' => $filiere->id,
                'nom' => $filiere->nom,
                'modules_count' => (int) $filiere->modules_count,
            ]);

        $growthWindowMonths = 6;
        $recentGrowth = $this->buildRecentGrowthDataset($growthWindowMonths);

        return response()->json([
            'kpis' => [
                'stagiaires' => $totalStagiaires,
                'professeurs' => $totalProfesseurs,
                'filieres' => $totalFilieres,
                'groupes' => $totalGroupes,
                'modules' => $totalModules,
                'notes' => $totalNotes,
                'validated_notes' => $validatedNotes,
                'pending_notes' => $pendingNotes,
                'rejected_notes' => $rejectedNotes,
                'average_grade' => round($averageGrade, 2),
                'success_rate' => $successRate,
                'fail_rate' => $failRate,
                'changes' => [
                    'stagiaires' => $this->calculateGrowthChange(Stagiaire::class),
                    'professeurs' => $this->calculateGrowthChange(Professeur::class),
                    'filieres' => $this->calculateGrowthChange(Filier::class),
                    'groupes' => $this->calculateGrowthChange(Groupe::class),
                    'modules' => $this->calculateGrowthChange(Module::class),
                ],
            ],
            'charts' => [
                'groupes_per_filiere' => $groupesPerFiliere,
                'stagiaires_per_groupe' => $stagiairesPerGroupe,
                'modules_distribution' => $modulesDistribution,
                'recent_growth' => $recentGrowth,
            ],
        ]);
    }

    private function calculateGrowthChange(string $modelClass): float
    {
        /** @var Model $modelClass */
        $currentStart = now()->copy()->subDays(30)->startOfDay();
        $previousStart = now()->copy()->subDays(60)->startOfDay();
        $previousEnd = $currentStart->copy()->subSecond();

        $currentCount = $modelClass::query()
            ->where('created_at', '>=', $currentStart)
            ->count();

        $previousCount = $modelClass::query()
            ->whereBetween('created_at', [$previousStart, $previousEnd])
            ->count();

        if ($previousCount === 0) {
            return $currentCount > 0 ? 100.0 : 0.0;
        }

        return round((($currentCount - $previousCount) / $previousCount) * 100, 2);
    }

    private function buildRecentGrowthDataset(int $months): Collection
    {
        $end = CarbonImmutable::now()->startOfMonth();
        $start = $end->subMonths($months - 1);
        $periods = collect(range(0, $months - 1))
            ->map(fn (int $offset) => $start->addMonths($offset));

        $series = [
            'filieres' => $this->fetchMonthlyCounts(Filier::class, $start),
            'groupes' => $this->fetchMonthlyCounts(Groupe::class, $start),
            'stagiaires' => $this->fetchMonthlyCounts(Stagiaire::class, $start),
            'professeurs' => $this->fetchMonthlyCounts(Professeur::class, $start),
            'modules' => $this->fetchMonthlyCounts(Module::class, $start),
        ];

        return $periods->map(function (CarbonImmutable $month) use ($series) {
            $periodKey = $month->format('Y-m');

            $entry = [
                'period' => $periodKey,
                'label' => $month->translatedFormat('M Y'),
            ];

            foreach ($series as $key => $counts) {
                $entry[$key] = (int) ($counts[$periodKey] ?? 0);
            }

            $entry['total'] = $entry['filieres']
                + $entry['groupes']
                + $entry['stagiaires']
                + $entry['professeurs']
                + $entry['modules'];

            return $entry;
        })->values();
    }

    private function fetchMonthlyCounts(string $modelClass, CarbonImmutable $start): array
    {
        /** @var Model $modelClass */
        return $modelClass::query()
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as period")
            ->selectRaw('COUNT(*) as aggregate')
            ->where('created_at', '>=', $start->startOfMonth())
            ->groupBy('period')
            ->orderBy('period')
            ->pluck('aggregate', 'period')
            ->map(fn ($value) => (int) $value)
            ->all();
    }
}
