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
        $validated = $request->validate([
            'groupe_id' => ['nullable', 'integer', 'exists:groupes,id'],
            'date' => ['nullable', 'date'],
        ]);

        $professeur = $request->user()->professeur;

        if (!$professeur) {
            return response()->json(['message' => 'Professeur profile not found.'], 404);
        }

        $profGroupes = $professeur->groupes()->pluck('groupes.id');

        if (!empty($validated['groupe_id']) && ! $profGroupes->contains((int) $validated['groupe_id'])) {
            return response()->json([
                'message' => 'Unauthorized access to this groupe.',
            ], 403);
        }

        $query = $professeur->emploisDuTemps()
            ->with(['groupe.filier', 'module'])
            ->orderBy('day_of_week')
            ->orderBy('start_time');

        if (!empty($validated['groupe_id'])) {
            $query->where('groupe_id', $validated['groupe_id']);
        }

        if (!empty($validated['date'])) {
            $query->whereDate('date', $validated['date']);
        }

        $emplois = $query->get()->groupBy(function ($emploi) {
            return $emploi->day_of_week . ' (' . $emploi->groupe->nom . ')';
        });

        return response()->json([
            'data' => $emplois,
            'grouped' => true,
        ]);
    }
}
