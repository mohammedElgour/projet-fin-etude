<?php

namespace App\Http\Controllers\Api\Professeur\Concerns;

use App\Models\Professeur;
use Illuminate\Http\Request;

trait ResolvesProfessorScope
{
    protected function resolveProfessorProfile(Request $request): Professeur
    {
        return $request->user()
            ->loadMissing('professeur.filiere')
            ->professeur
            ?? abort(403, 'Profil professeur introuvable.');
    }

    protected function resolveProfessorFiliereId(Professeur $professeur): ?int
    {
        return $professeur->filiere_id ? (int) $professeur->filiere_id : null;
    }
}
