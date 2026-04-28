<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\GroupeResource;
use App\Models\Groupe;
use Illuminate\Http\Request;

class GroupeController extends Controller
{
    public function index()
    {
        $groupes = Groupe::with('filier')->withCount('stagiaires')->paginate(10);

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
        return new GroupeResource($groupe->load('filier')->loadCount('stagiaires'));
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
