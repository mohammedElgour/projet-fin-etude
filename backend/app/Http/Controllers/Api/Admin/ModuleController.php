<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Module;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ModuleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'filiere_id' => ['nullable', 'integer', 'exists:filiers,id'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'sort_by' => ['nullable', 'in:nom,coefficient,created_at,notes_count'],
            'sort_dir' => ['nullable', 'in:asc,desc'],
        ]);

        $sortBy = $validated['sort_by'] ?? 'created_at';
        $sortDir = $validated['sort_dir'] ?? 'desc';
        $search = trim((string) ($validated['search'] ?? ''));

        $modules = Module::query()
            ->with('filier')
            ->withCount('notes')
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

        return response()->json($modules);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'coefficient' => ['required', 'numeric', 'min:0', 'max:99.99'],
            'filiere_id' => ['required', 'exists:filiers,id'],
        ]);

        $module = Module::create($validated);

        return response()->json($module->load('filier'), 201);
    }

    public function show(Module $module): JsonResponse
    {
        $module->load(['filier', 'notes.stagiaire.user'])
            ->loadCount('notes');

        return response()->json($module);
    }

    public function update(Request $request, Module $module): JsonResponse
    {
        $validated = $request->validate([
            'nom' => ['sometimes', 'required', 'string', 'max:255'],
            'coefficient' => ['sometimes', 'required', 'numeric', 'min:0', 'max:99.99'],
            'filiere_id' => ['sometimes', 'required', 'exists:filiers,id'],
        ]);

        $module->update($validated);

        return response()->json($module->fresh()->load('filier'));
    }

    public function destroy(Module $module): JsonResponse
    {
        $module->delete();

        return response()->json(null, 204);
    }
}
