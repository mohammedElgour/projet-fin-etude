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
        $professeur->loadMissing(['groupes']);

        $assignedGroupeIds = $professeur->groupes()->pluck('groupes.id');

        if (!$assignedGroupeIds->count()) {
            return response()->json(
                ProfessorScheduleResource::collection(
                    EmploiDuTemps::query()->whereRaw('1 = 0')->paginate(20)
                )
            );
        }

        $query = EmploiDuTemps::query()
            ->with(['groupe.filiere'])
            ->whereIn('groupe_id', $assignedGroupeIds);

        if ($request->filled('groupe_id')) {
            $requestedGroupeId = $request->integer('groupe_id');
            if (!$professeur->groupes->contains(fn ($g) => (int) $g->id === (int) $requestedGroupeId)) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
            $query->where('groupe_id', $requestedGroupeId);
        }


        // Date filter (robust): treat `date` column as potentially DATETIME/TIMESTAMP.
        // Also log incoming value to debug format issues.
        if ($request->filled('date')) {
            $selectedDate = $request->string('date');

            \Log::info('Professor schedule date filter', [
                'selected_date' => $selectedDate,
                'groupe_ids' => $assignedGroupeIds,
            ]);

            // Use a day range instead of whereDate() to handle DATETIME columns.
            $query->whereBetween('date', [
                $selectedDate . ' 00:00:00',
                $selectedDate . ' 23:59:59',
            ]);
        }


        return response()->json(
            ProfessorScheduleResource::collection(
                $query->orderByDesc('date')->paginate(20)
            )
        );
    }
}
