<?php

namespace App\Http\Controllers\Api\Professeur;

use App\Http\Controllers\Controller;
use App\Models\Groupe;
use App\Models\Module;
use App\Models\Stagiaire;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Stagiaire::with(['user', 'groupe.filier', 'notes.module']);

        if ($request->filled('groupe_id')) {
            $query->where('groupe_id', $request->integer('groupe_id'));
        }

        if ($request->filled('module_id')) {
            $moduleId = $request->integer('module_id');
            $query->with([
                'notes' => fn ($notes) => $notes->where('module_id', $moduleId)->with('module'),
            ]);
        }

        return response()->json($query->paginate(20));
    }

    public function catalog(): JsonResponse
    {
        return response()->json([
            'groupes' => Groupe::with('filier')->orderBy('nom')->get(),
            'modules' => Module::with('filier')->orderBy('nom')->get(),
        ]);
    }
}
