<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\GroupeResource;
use App\Models\Groupe;
use Illuminate\Http\Request;

class GroupeController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'filiere_id' => ['nullable', 'integer', 'exists:filiers,id'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'sort_by' => ['nullable', 'in:nom,students_count,created_at'],
            'sort_dir' => ['nullable', 'in:asc,desc'],
        ]);

        $sortBy = $validated['sort_by'] ?? 'created_at';
        $sortDir = $validated['sort_dir'] ?? 'desc';
        $search = trim((string) ($validated['search'] ?? ''));

        $groupes = Groupe::with('filier')
            ->withCount('stagiaires')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($nestedQuery) use ($search) {
                    $nestedQuery
                        ->where('nom', 'like', "%{$search}%")
                        ->orWhereHas('filier', function ($filiereQuery) use ($search) {
                            $filiereQuery->where('nom', 'like', "%{$search}%");
                        });
                });
            })
            ->when(!empty($validated['filiere_id']), function ($query) use ($validated) {
                $query->where('filiere_id', $validated['filiere_id']);
            })
            ->orderBy($sortBy, $sortDir)
            ->paginate($validated['per_page'] ?? 10)
            ->appends($request->query());

        return GroupeResource::collection($groupes);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'filiere_id' => ['required', 'exists:filiers,id'],
        ]);

        $groupe = Groupe::create($validated);

        return response()->json(new GroupeResource($groupe->load('filier')), 201);
    }

    public function show(Groupe $groupe)
    {
        return new GroupeResource(
            $groupe->load(['filier', 'stagiaires.user'])->loadCount('stagiaires')
        );
    }

    public function update(Request $request, Groupe $groupe)
    {
        $validated = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'filiere_id' => ['required', 'exists:filiers,id'],
        ]);

        $groupe->update($validated);

        return new GroupeResource($groupe->fresh()->load('filier')->loadCount('stagiaires'));
    }

    public function destroy(Groupe $groupe)
    {
        $groupe->delete();

        return response()->json(['message' => 'Groupe supprime avec succes']);
    }
}
