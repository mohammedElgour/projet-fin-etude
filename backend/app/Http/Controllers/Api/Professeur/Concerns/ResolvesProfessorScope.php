<?php

namespace App\Http\Controllers\Api\Professeur\Concerns;

use App\Models\Professeur;
use Illuminate\Http\Request;

trait ResolvesProfessorScope
{
    protected function resolveProfessorProfile(Request $request): Professeur
    {
        return $request->user()
            ->loadMissing('professeur.groupes.filiere', 'professeur.modules.filiere')
            ->professeur
            ?? abort(403, 'Profil professeur introuvable.');
    }
}
