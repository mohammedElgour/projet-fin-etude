<?php

namespace App\Http\Controllers\Api\Professeur;

use App\Http\Controllers\Controller;
use App\Models\Filier;
use App\Models\Stagiaire;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'groupe_id' => ['nullable', 'integer', 'exists:groupes,id'],
            'module_id' => ['nullable', 'integer', 'exists:modules,id'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $professeur = $request->user()->professeur;

        if (!$professeur) {
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

        $query = Stagiaire::with([
            'user',
            'groupe.filier',
            'notes' => fn ($notes) => $notes
                ->where('professeur_id', $professeur->id)
                ->with('module'),
        ]);

        $query->whereIn('groupe_id', $profGroupes);

        if (!empty($validated['groupe_id'])) {
            $query->where('groupe_id', $validated['groupe_id']);
        }

        if (!empty($validated['module_id'])) {
            $moduleId = $validated['module_id'];
            $query->whereHas('notes', fn($q) => $q
                ->where('module_id', $moduleId)
                ->where('professeur_id', $professeur->id));
            $query->with([
                'notes' => fn ($notes) => $notes
                    ->where('professeur_id', $professeur->id)
                    ->where('module_id', $moduleId)
                    ->with('module'),
            ]);
        }

        return response()->json($query->paginate($validated['per_page'] ?? 20));
    }

    public function catalog(Request $request): JsonResponse
    {
        $professeur = $request->user()->professeur;

        if (!$professeur) {
            return response()->json(['message' => 'Professeur profile not found.'], 404);
        }

        $groupes = $professeur->groupes()
            ->with('filier')
            ->get()
            ->unique('id')
            ->values();

        $modules = $professeur->modules()
            ->with('filier')
            ->get()
            ->unique('id')
            ->values();

        $filiereIds = $groupes->pluck('filiere_id')->filter()->unique()->values();

        return response()->json([
            'filieres' => Filier::query()
                ->whereIn('id', $filiereIds)
                ->orderBy('nom')
                ->get(),
            'groupes' => $groupes->sortBy('nom')->values(),
            'modules' => $modules->sortBy('nom')->values(),
        ]);
    }
}
