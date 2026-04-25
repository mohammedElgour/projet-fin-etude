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
    public function index()
    {
        $filieres = Filier::with(['modules', 'groupes'])->paginate(10);

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

