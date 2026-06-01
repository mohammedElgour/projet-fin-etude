<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Professeur;
use App\Models\Stagiaire;
use App\Models\Timetable;
use App\Services\NotificationDeliveryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

class AdminTimetableController extends Controller
{
    public function __construct(private NotificationDeliveryService $notifications)
    {
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $query = Timetable::with([
                'groupe.filier',
                'groupes.filier',
                'professeurs.user',
                'creator',
                'uploader',
            ])->latest();

            if ($user->role === 'professeur') {
                $professeur = Professeur::where('user_id', $user->id)->firstOrFail();
                $query->whereHas('professeurs', fn ($builder) => $builder->where('professeurs.id', $professeur->id));
            } elseif ($user->role === 'stagiaire') {
                $stagiaire = Stagiaire::where('user_id', $user->id)->firstOrFail();
                $query->where(function ($builder) use ($stagiaire) {
                    $builder
                        ->where('groupe_id', $stagiaire->groupe_id)
                        ->orWhereHas('groupes', fn ($groupQuery) => $groupQuery->where('groupes.id', $stagiaire->groupe_id));
                });
            } else {
                if ($request->filled('groupe_id')) {
                    $groupeId = $request->integer('groupe_id');
                    $query->where(function ($builder) use ($groupeId) {
                        $builder
                            ->where('groupe_id', $groupeId)
                            ->orWhereHas('groupes', fn ($groupQuery) => $groupQuery->where('groupes.id', $groupeId));
                    });
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
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'groupe_ids' => ['nullable', 'array'],
            'groupe_ids.*' => ['integer', 'exists:groupes,id'],
            'groupe_id' => ['nullable', 'exists:groupes,id'],
            'professeur_id' => ['nullable', 'integer', 'exists:professeurs,id'],
        ]);

        $groupeIds = collect($validated['groupe_ids'] ?? [])
            ->push($validated['groupe_id'] ?? null)
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        $hasGroupe = $groupeIds->isNotEmpty();
        $hasProfesseur = !empty($validated['professeur_id']);

        if ($hasGroupe === $hasProfesseur) {
            return response()->json([
                'message' => 'Choisissez soit un groupe, soit un professeur.',
                'errors' => [
                    'groupe_id' => ['Choisissez soit un groupe, soit un professeur.'],
                ],
            ], 422);
        }

        try {
            $timetable = DB::transaction(function () use ($request, $validated, $groupeIds) {
                $path = $request->file('image')->store('timetables', 'public');

                $timetable = Timetable::create([
                    'title' => $validated['title'] ?? null,
                    'image_path' => $path,
                    'groupe_id' => $groupeIds->first(),
                    'created_by' => $request->user()->id,
                    'uploaded_by' => $request->user()->id,
                ]);

                if ($groupeIds->isNotEmpty()) {
                    $timetable->groupes()->sync($groupeIds->all());
                } elseif (!empty($validated['professeur_id'])) {
                    $timetable->professeurs()->sync([$validated['professeur_id']]);
                }

                return $timetable->load(['groupe.filier', 'groupes.filier', 'professeurs.user', 'creator', 'uploader']);
            });

            $this->notifyTimetableRecipients($timetable);

            return response()->json($this->transformTimetable($timetable), 201);
        } catch (Throwable $exception) {
            Log::error('Failed to store timetable.', [
                'user_id' => $request->user()?->id,
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'message' => "Impossible d'enregistrer l'emploi du temps pour le moment.",
            ], 500);
        }
    }

    public function show(Request $request, Timetable $timetable): JsonResponse
    {
        try {
            $timetable->load(['groupe.filier', 'groupes.filier', 'professeurs.user', 'creator', 'uploader']);

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

    public function update(Request $request, Timetable $timetable): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'groupe_ids' => ['nullable', 'array'],
            'groupe_ids.*' => ['integer', 'exists:groupes,id'],
            'groupe_id' => ['nullable', 'exists:groupes,id'],
            'professeur_id' => ['nullable', 'integer', 'exists:professeurs,id'],
        ]);

        $groupeIds = collect($validated['groupe_ids'] ?? [])
            ->push($validated['groupe_id'] ?? null)
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        $hasGroupe = $groupeIds->isNotEmpty();
        $hasProfesseur = !empty($validated['professeur_id']);

        if ($hasGroupe === $hasProfesseur) {
            return response()->json([
                'message' => 'Choisissez soit un ou plusieurs groupes, soit un professeur.',
                'errors' => [
                    'groupe_ids' => ['Choisissez soit un ou plusieurs groupes, soit un professeur.'],
                ],
            ], 422);
        }

        try {
            $updated = DB::transaction(function () use ($request, $validated, $timetable, $groupeIds) {
                $oldPath = null;

                if ($request->hasFile('image')) {
                    $oldPath = $timetable->image_path;
                    $timetable->image_path = $request->file('image')->store('timetables', 'public');
                }

                $timetable->title = $validated['title'] ?? null;
                $timetable->groupe_id = $groupeIds->first();
                $timetable->uploaded_by = $request->user()->id;
                $timetable->save();

                if ($groupeIds->isNotEmpty()) {
                    $timetable->groupes()->sync($groupeIds->all());
                    $timetable->professeurs()->sync([]);
                } else {
                    $timetable->groupes()->sync([]);
                    $timetable->professeurs()->sync([$validated['professeur_id']]);
                }

                if ($oldPath) {
                    Storage::disk('public')->delete($oldPath);
                }

                return $timetable->load(['groupe.filier', 'groupes.filier', 'professeurs.user', 'creator', 'uploader']);
            });

            return response()->json($this->transformTimetable($updated));
        } catch (Throwable $exception) {
            Log::error('Failed to update timetable.', [
                'user_id' => $request->user()?->id,
                'timetable_id' => $timetable->id,
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'message' => "Impossible de remplacer l'emploi du temps pour le moment.",
            ], 500);
        }
    }

    public function destroy(Request $request, Timetable $timetable): JsonResponse
    {
        try {
            DB::transaction(function () use ($timetable) {
                $path = $timetable->image_path;
                $timetable->delete();

                if ($path) {
                    Storage::disk('public')->delete($path);
                }
            });

            return response()->json([
                'message' => 'Emploi du temps supprime avec succes.',
            ]);
        } catch (Throwable $exception) {
            Log::error('Failed to delete timetable.', [
                'user_id' => $request->user()?->id,
                'timetable_id' => $timetable->id,
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'message' => "Impossible de supprimer l'emploi du temps pour le moment.",
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
                ? (
                    (int) $timetable->groupe_id === (int) $stagiaire->groupe_id
                    || $timetable->groupes->contains('id', $stagiaire->groupe_id)
                )
                : false;
        }

        return false;
    }

    private function notifyTimetableRecipients(Timetable $timetable): void
    {
        $timetable->loadMissing([
            'groupe.stagiaires.user',
            'groupe.professeurs.user',
            'groupes.stagiaires.user',
            'groupes.professeurs.user',
            'professeurs.user',
        ]);

        $recipients = collect();

        $groups = $timetable->groupes->isNotEmpty()
            ? $timetable->groupes
            : collect($timetable->groupe ? [$timetable->groupe] : []);

        foreach ($groups as $groupe) {
            $recipients = $recipients->merge(
                $groupe->stagiaires
                    ->map(fn (Stagiaire $stagiaire) => $stagiaire->user)
                    ->filter()
            );

            $recipients = $recipients->merge(
                $groupe->professeurs
                    ->map(fn (Professeur $professeur) => $professeur->user)
                    ->filter()
            );
        }

        $recipients = $recipients
            ->merge(
                $timetable->professeurs
                    ->map(fn (Professeur $professeur) => $professeur->user)
                    ->filter()
            )
            ->unique('id')
            ->values();

        $this->notifications->sendToUsers(
            $recipients,
            'Emploi du temps',
            $this->buildTimetableNotificationMessage()
        );
    }

    private function buildTimetableNotificationMessage(): string
    {
        return 'Votre emploi du temps a été mis à jour';
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
            'groupes' => $timetable->groupes->map(fn ($groupe) => [
                'id' => $groupe->id,
                'nom' => $groupe->nom,
                'filiere' => $groupe->filiere ? [
                    'id' => $groupe->filiere->id,
                    'nom' => $groupe->filiere->nom,
                ] : null,
            ])->values(),
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
            'uploaded_by' => $timetable->uploaded_by,
            'creator' => $timetable->creator ? [
                'id' => $timetable->creator->id,
                'name' => $timetable->creator->name,
            ] : null,
            'uploader' => $timetable->uploader ? [
                'id' => $timetable->uploader->id,
                'name' => $timetable->uploader->name,
            ] : null,
            'audience_type' => $timetable->groupes->isNotEmpty() || $timetable->groupe_id ? 'groupe' : 'professeurs',
            'created_at' => optional($timetable->created_at)?->toISOString(),
            'updated_at' => optional($timetable->updated_at)?->toISOString(),
        ];
    }
}
