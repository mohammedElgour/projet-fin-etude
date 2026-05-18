<?php

namespace App\Http\Controllers\Api\Professeur;

use App\Http\Controllers\Api\Professeur\Concerns\ResolvesProfessorScope;
use App\Http\Controllers\Controller;
use App\Http\Resources\Professeur\ProfessorScheduleResource;
use App\Models\EmploiDuTemps;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    use ResolvesProfessorScope;

    public function index(Request $request): JsonResponse
    {
        $professeur = $this->resolveProfessorProfile($request);
        $filiereId = $this->resolveProfessorFiliereId($professeur);

        if (!$filiereId) {
            return response()->json(
                ProfessorScheduleResource::collection(
                    EmploiDuTemps::query()->whereRaw('1 = 0')->paginate(20)
                )
            );
        }

        $query = EmploiDuTemps::query()
            ->with(['groupe.filiere'])
            ->whereHas('groupe', fn ($query) => $query->where('filiere_id', $filiereId));

        if ($request->filled('groupe_id')) {
            $query->where('groupe_id', $request->integer('groupe_id'));
        }

        return response()->json(
            ProfessorScheduleResource::collection(
                $query->orderByDesc('date')->paginate(20)
            )
        );
    }
}
