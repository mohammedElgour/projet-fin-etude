<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Filiere\StoreFiliereRequest;
use App\Http\Requests\Api\Filiere\UpdateFiliereRequest;
use App\Http\Resources\FiliereResource;
use App\Models\Filier;
use App\Support\FiliereNameNormalizer;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class FiliereController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $perPage = max(1, min((int) $request->integer('per_page', 10), 100));
            $page = LengthAwarePaginator::resolveCurrentPage();

            $filieres = Filier::query()
                ->withCount(['modules', 'groupes'])
                ->get()
                ->map(function (Filier $filiere) {
                    $filiere->nom = FiliereNameNormalizer::canonicalize($filiere->nom);

                    return $filiere;
                })
                ->sortBy(function (Filier $filiere) {
                    return [
                        FiliereNameNormalizer::key($filiere->nom),
                        $filiere->id,
                    ];
                })
                ->unique(function (Filier $filiere) {
                    return FiliereNameNormalizer::key($filiere->nom);
                })
                ->values();

            $paginator = new LengthAwarePaginator(
                $filieres->forPage($page, $perPage)->values(),
                $filieres->count(),
                $perPage,
                $page,
                [
                    'path' => $request->url(),
                    'query' => $request->query(),
                ]
            );

            return FiliereResource::collection($paginator);
        } catch (Throwable $exception) {
            Log::error('Failed to fetch filieres list.', [
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'message' => 'Unable to load filieres at the moment.',
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreFiliereRequest $request)
    {
        $filier = Filier::create($request->validated());

        return response()->json($filier->load(['modules', 'groupes']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Filier $filier)
    {
        $filier->load(['modules.groupes', 'groupes.stagiaires']);

        return response()->json($filier);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateFiliereRequest $request, Filier $filier)
    {
        $filier->update($request->validated());

        return response()->json($filier->fresh());
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Filier $filier)
    {
        $filier->delete();

        return response()->json(null, 204);
    }
}
