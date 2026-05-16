<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Professeur;
use App\Models\Stagiaire;
use App\Models\Timetable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class AdminTimetableController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $query = Timetable::with([
                'groupe.filier',
                'professeurs.user',
                'creator',
            ])->latest();

            if ($user->role === 'professeur') {
                $professeur = Professeur::where('user_id', $user->id)->firstOrFail();
                $query->whereHas('professeurs', fn ($builder) => $builder->where('professeurs.id', $professeur->id));
            } elseif ($user->role === 'stagiaire') {
                $stagiaire = Stagiaire::where('user_id', $user->id)->firstOrFail();
                $query->where('groupe_id', $stagiaire->groupe_id);
            } else {
                if ($request->filled('groupe_id')) {
                    $query->where('groupe_id', $request->integer('groupe_id'));
                }

                if ($request->filled('professeur_id')) {
                    $professeurId = $request->integer('professeur_id');
                    $query->whereHas('professeurs', fn ($builder) => $builder->where('professeurs.id', $professeurId));
                }
            }

            return response()->json(
                $query->paginate(20)->through(fn (Timetable $timetable) => $this->transformTimetable($timetable))
            );
        } catch (Throwable $exception) {
            Log::error('Failed to fetch timetables list.', [
                'user_id' => $request->user()?->id,
                'role' => $request->user()?->role,
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'message' => 'Unable to load timetables at the moment.',
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'image' => ['required', 'image', 'max:5120'],
            'groupe_id' => ['nullable', 'exists:groupes,id'],
            'professeur_ids' => ['nullable', 'array', 'min:1'],
            'professeur_ids.*' => ['integer', 'exists:professeurs,id'],
        ]);

        $hasGroupe = !empty($validated['groupe_id']);
        $hasProfesseurs = !empty($validated['professeur_ids']);

        if ($hasGroupe === $hasProfesseurs) {
            return response()->json([
                'message' => 'Choisissez soit un groupe, soit un ou plusieurs professeurs.',
                'errors' => [
                    'groupe_id' => ['Choisissez soit un groupe, soit un ou plusieurs professeurs.'],
                ],
            ], 422);
        }

        $timetable = DB::transaction(function () use ($request, $validated) {
            $path = $request->file('image')->store('timetables', 'public');

            $timetable = Timetable::create([
                'title' => $validated['title'] ?? null,
                'image_path' => $path,
                'groupe_id' => $validated['groupe_id'] ?? null,
                'created_by' => $request->user()->id,
            ]);

            if (!empty($validated['professeur_ids'])) {
                $timetable->professeurs()->sync($validated['professeur_ids']);
            }

            return $timetable->load(['groupe.filier', 'professeurs.user', 'creator']);
        });

        return response()->json($this->transformTimetable($timetable), 201);
    }

    public function show(Request $request, Timetable $timetable): JsonResponse
    {
        try {
            $timetable->load(['groupe.filier', 'professeurs.user', 'creator']);

            abort_unless($this->canAccessTimetable($request->user(), $timetable), 403, 'Acces non autorise a cet emploi du temps.');

            return response()->json($this->transformTimetable($timetable));
        } catch (Throwable $exception) {
            Log::error('Failed to fetch timetable details.', [
                'user_id' => $request->user()?->id,
                'timetable_id' => $timetable->id,
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'message' => 'Unable to load this timetable at the moment.',
            ], 500);
        }
    }

    private function canAccessTimetable($user, Timetable $timetable): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role === 'professeur') {
            $professeur = Professeur::where('user_id', $user->id)->first();

            return $professeur
                ? $timetable->professeurs->contains('id', $professeur->id)
                : false;
        }

        if ($user->role === 'stagiaire') {
            $stagiaire = Stagiaire::where('user_id', $user->id)->first();

            return $stagiaire
                ? (int) $timetable->groupe_id === (int) $stagiaire->groupe_id
                : false;
        }

        return false;
    }

    private function transformTimetable(Timetable $timetable): array
    {
        return [
            'id' => $timetable->id,
            'title' => $timetable->title,
            'image_path' => $timetable->image_path,
            'image_url' => $timetable->image_url,
            'groupe_id' => $timetable->groupe_id,
            'groupe' => $timetable->groupe ? [
                'id' => $timetable->groupe->id,
                'nom' => $timetable->groupe->nom,
                'filiere' => $timetable->groupe->filiere ? [
                    'id' => $timetable->groupe->filiere->id,
                    'nom' => $timetable->groupe->filiere->nom,
                ] : null,
            ] : null,
            'professeurs' => $timetable->professeurs->map(fn (Professeur $professeur) => [
                'id' => $professeur->id,
                'specialite' => $professeur->specialite,
                'user' => [
                    'id' => $professeur->user?->id,
                    'name' => $professeur->user?->name,
                    'first_name' => $professeur->user?->first_name,
                    'last_name' => $professeur->user?->last_name,
                    'email' => $professeur->user?->email,
                ],
            ])->values(),
            'created_by' => $timetable->created_by,
            'creator' => $timetable->creator ? [
                'id' => $timetable->creator->id,
                'name' => $timetable->creator->name,
            ] : null,
            'audience_type' => $timetable->groupe_id ? 'groupe' : 'professeurs',
            'created_at' => optional($timetable->created_at)?->toISOString(),
            'updated_at' => optional($timetable->updated_at)?->toISOString(),
        ];
    }
}
