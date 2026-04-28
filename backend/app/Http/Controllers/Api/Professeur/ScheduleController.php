<?php

namespace App\Http\Controllers\Api\Professeur;

use App\Http\Controllers\Controller;
use App\Models\EmploiDuTemps;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = EmploiDuTemps::with(['groupe.filier']);

        if ($request->filled('groupe_id')) {
            $query->where('groupe_id', $request->integer('groupe_id'));
        }

        return response()->json($query->orderByDesc('date')->paginate(20));
    }
}
