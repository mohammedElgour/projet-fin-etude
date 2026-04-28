<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Groupe;
use Illuminate\Http\Request;
use App\Http\Resources\GroupeResource;

class GroupeController extends Controller
{
    public function index()
    {
        $groupes = Groupe::with(['filier', 'professeur'])->paginate(10);
        return response()->json($groupes);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom_groupe' => 'required|string|max:255',
            'filier_id' => 'required|exists:filieres,id',
            'niveau' => 'required|string|max:50',
            'capacite' => 'required|integer|min:1',
            'professeur_id' => 'nullable|exists:professeurs,id'
        ]);

        $groupe = Groupe::create($validated);
        return response()->json(new GroupeResource($groupe), 201);
    }

    public function show(Groupe $groupe)
    {
        return new GroupeResource($groupe->load(['filier', 'professeur']));
    }

    public function update(Request $request, Groupe $groupe)
    {
        $validated = $request->validate([
            'nom_groupe' => 'required|string|max:255',
            'filier_id' => 'required|exists:filieres,id',
            'niveau' => 'required|string|max:50',
            'capacite' => 'required|integer|min:1',
            'professeur_id' => 'nullable|exists:professeurs,id'
        ]);

        $groupe->update($validated);
        return new GroupeResource($groupe->fresh());
    }

    public function destroy(Groupe $groupe)
    {
        $groupe->delete();
        return response()->json(['message' => 'Groupe supprimé avec succès']);
    }
}
