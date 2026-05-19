<?php

namespace App\Http\Controllers\Api\Professeur\Concerns;

use App\Models\Professeur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;


trait ResolvesProfessorScope
{
    protected function resolveProfessorProfile(Request $request): Professeur
    {

        return $request->user()
            ->loadMissing('professeur.filiere')
            ->professeur
            ?? abort(403, 'Profil professeur introuvable.');
    }

    /**
     * Returns the professor filiere_id.
     *
     * IMPORTANT: Never silently return null/empty datasets for missing filiere.
     */
    protected function resolveProfessorFiliereIdOrFail(Professeur $professeur): int
    {
        if (! $professeur->filiere_id) {

            Log::warning('Professor without filiere', [
                'professeur_id' => $professeur->id,
                'user_id' => $professeur->user_id,
            ]);

            abort(Response::HTTP_BAD_REQUEST, 'Professor has no filiere assigned');
        }

        return (int) $professeur->filiere_id;
    }

    protected function resolveProfessorFiliereId(Professeur $professeur): ?int
    {
        return $professeur->filiere_id ? (int) $professeur->filiere_id : null;
    }
}

