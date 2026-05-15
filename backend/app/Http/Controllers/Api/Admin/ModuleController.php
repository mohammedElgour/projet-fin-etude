<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Module;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ModuleController extends Controller
{
    public function index(): JsonResponse
    {
        $modules = Module::with('filier')->paginate(15);

        return response()->json($modules);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50'],
            'nom' => ['required', 'string', 'max:255'],
            'coefficient' => ['required', 'numeric', 'min:0', 'max:99.99'],
            'filiere_id' => ['required', 'exists:filiers,id'],
        ]);

        $module = Module::create($validated);

        return response()->json($module->load('filier'), 201);
    }

    public function show(Module $module): JsonResponse
    {
        $module->load('filier');

        return response()->json($module);
    }

    public function update(Request $request, Module $module): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['sometimes', 'required', 'string', 'max:50'],
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
