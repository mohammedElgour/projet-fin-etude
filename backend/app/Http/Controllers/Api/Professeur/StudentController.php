<?php

namespace App\Http\Controllers\Api\Professeur;

use App\Http\Controllers\Controller;
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

        return response()->json($query->paginate(20));
    }
}
