<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Filiere\StoreFiliereRequest;
use App\Http\Requests\Api\Filiere\UpdateFiliereRequest;
use App\Models\Filier;
use Illuminate\Http\Request;

class FiliereController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'sort_by' => ['nullable', 'in:nom,created_at,modules_count,groupes_count'],
            'sort_dir' => ['nullable', 'in:asc,desc'],
        ]);

        $sortBy = $validated['sort_by'] ?? 'created_at';
        $sortDir = $validated['sort_dir'] ?? 'desc';
        $search = trim((string) ($validated['search'] ?? ''));

        $filieres = Filier::query()
            ->with(['modules', 'groupes'])
            ->withCount(['modules', 'groupes'])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($nestedQuery) use ($search) {
                    $nestedQuery
                        ->where('nom', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->orderBy($sortBy, $sortDir)
            ->paginate($validated['per_page'] ?? 10)
            ->appends($request->query());

        return response()->json($filieres);
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
    public function show(Filier $filiere)
    {
        $filiere = Filier::query()
            ->with(['modules', 'groupes.stagiaires.user'])
            ->withCount(['modules', 'groupes'])
            ->findOrFail($filiere->id);

        return response()->json($filiere);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateFiliereRequest $request, Filier $filiere)
    {
        $filiere->update($request->validated());

        return response()->json($filiere->fresh());
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Filier $filiere)
    {
        $filiere->delete();

        return response()->json(null, 204);
    }
}
