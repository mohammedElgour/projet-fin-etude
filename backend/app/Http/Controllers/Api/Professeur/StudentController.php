<?php

namespace App\Http\Controllers\Api\Professeur;

use App\Http\Controllers\Api\Professeur\Concerns\ResolvesProfessorScope;
use App\Http\Controllers\Controller;
use App\Http\Resources\Professeur\ProfessorStudentResource;
use App\Models\Groupe;
use App\Models\Module;
use App\Models\Stagiaire;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    use ResolvesProfessorScope;

    public function index(Request $request): JsonResponse
    {
        $professeur = $this->resolveProfessorProfile($request);
        $professeur->loadMissing(['groupes', 'modules']);

        $assignedGroupeIds = $professeur->groupes()->pluck('groupes.id');
        $moduleId = $request->integer('module_id');

        if (!$assignedGroupeIds->count()) {
            return response()->json(
                ProfessorStudentResource::collection(
                    Stagiaire::query()->whereRaw('1 = 0')->paginate(20)
                )
            );
        }

        $query = Stagiaire::query()
            ->with([
                'user',
                'groupe.filiere',
                'notes' => function ($notes) use ($moduleId) {
                    if ($moduleId) {
                        $notes->where('module_id', $moduleId);
                    }

                    $notes->with('module')->latest('updated_at');
                },
            ])
            ->whereIn('groupe_id', $assignedGroupeIds);

        if ($request->filled('groupe_id')) {
            $requestedGroupeId = $request->integer('groupe_id');
            if (!$professeur->groupes->contains(fn ($g) => (int) $g->id === (int) $requestedGroupeId)) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
            $query->where('groupe_id', $requestedGroupeId);
        }


        if ($request->filled('search')) {
            $search = trim((string) $request->string('search'));

            $query->whereHas('user', function ($builder) use ($search) {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return response()->json(
            ProfessorStudentResource::collection(
                $query->orderBy('id')->paginate(20)
            )
        );
    }

    public function catalog(Request $request): JsonResponse
    {
        $professeur = $this->resolveProfessorProfile($request);
        $professeur->loadMissing(['groupes', 'modules', 'filiere']);

        return response()->json([
            'groupes' => $professeur->groupes->loadMissing('filiere')->sortBy('nom')->values(),
            'modules' => $professeur->modules->loadMissing('filiere')->sortBy('nom')->values(),
            'filiere' => $professeur->filiere ? [
                'id' => $professeur->filiere->id,
                'nom' => $professeur->filiere->nom,
            ] : null,
        ]);

    }
}
