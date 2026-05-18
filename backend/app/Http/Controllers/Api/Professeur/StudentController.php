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
        $filiereId = $this->resolveProfessorFiliereId($professeur);
        $moduleId = $request->integer('module_id');

        if (!$filiereId) {
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
            ->whereHas('groupe', fn ($query) => $query->where('filiere_id', $filiereId));

        if ($request->filled('groupe_id')) {
            $query->where('groupe_id', $request->integer('groupe_id'));
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
        $filiereId = $this->resolveProfessorFiliereId($professeur);

        if (!$filiereId) {
            return response()->json([
                'groupes' => [],
                'modules' => [],
                'filiere' => null,
            ]);
        }

        return response()->json([
            'groupes' => Groupe::query()
                ->with('filiere')
                ->where('filiere_id', $filiereId)
                ->orderBy('nom')
                ->get(),
            'modules' => Module::query()
                ->with('filiere')
                ->where('filiere_id', $filiereId)
                ->orderBy('nom')
                ->get(),
            'filiere' => $professeur->filiere ? [
                'id' => $professeur->filiere->id,
                'nom' => $professeur->filiere->nom,
            ] : null,
        ]);
    }
}
