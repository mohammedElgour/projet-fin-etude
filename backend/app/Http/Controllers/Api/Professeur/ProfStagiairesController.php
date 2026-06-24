<?php

namespace App\Http\Controllers\Api\Professeur;

use App\Http\Controllers\Api\Professeur\Concerns\ResolvesProfessorScope;
use App\Http\Controllers\Controller;
use App\Http\Resources\Professeur\ProfessorStudentResource;
use App\Models\Stagiaire;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfStagiairesController extends Controller
{
    use ResolvesProfessorScope;

    // GET /api/professeur/stagiaires?groupe_id=1
    public function index(Request $request): JsonResponse
    {
        $professeur = $this->resolveProfessorProfile($request);
        $professeur->loadMissing(['groupes']);

        $groupeId = $request->integer('groupe_id');

        // Access control: professor must be linked to the groupe via professeur_groupe.
        if (!$professeur->groupes->contains(fn ($g) => (int) $g->id === (int) $groupeId)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Module filter is OPTIONAL; when not provided (or 'all'), do not filter.
        // (This keeps the endpoint always returning students for the selected groupe.)
        $moduleId = $request->filled('module_id') ? $request->integer('module_id') : null;
        if ($moduleId === 0) {
            $moduleId = null;
        }

        $query = Stagiaire::query()
            ->with([
                'user',
                'groupe',
                'notes' => function ($notes) use ($moduleId) {
                    if ($moduleId) {
                        $notes->where('module_id', $moduleId);
                    }

                    $notes->with(['module', 'submission'])->latest('updated_at');
                },
            ])
            ->where('groupe_id', $groupeId);

        return response()->json(
            ProfessorStudentResource::collection($query->orderBy('id')->get())
        );
    }
}
