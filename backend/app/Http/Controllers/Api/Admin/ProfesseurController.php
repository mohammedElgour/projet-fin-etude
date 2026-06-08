<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Groupe;
use App\Models\Professeur;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProfesseurController extends Controller
{
    private function buildDisplayName(array $validated, ?User $user = null): string
    {
        $firstName = $validated['first_name'] ?? $user?->first_name ?? '';
        $lastName = $validated['last_name'] ?? $user?->last_name ?? '';

        return trim($firstName.' '.$lastName);
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = max(1, min($request->integer('per_page', 15), 200));
        $professeurs = Professeur::with(['user', 'filier', 'groupes.filiere'])->paginate($perPage);

        return response()->json($professeurs);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:30'],
            'address' => ['required', 'string'],
            'filiere_id' => ['required', 'exists:filiers,id'],
            'specialite' => ['required', 'string', 'max:255'],
            'group_ids' => ['required', 'array', 'min:1'],
            'group_ids.*' => ['integer', 'distinct', 'exists:groupes,id'],
            'password' => ['required', 'string', 'min:8'],
        ], [
            'group_ids.required' => 'Veuillez sÃ©lectionner au moins un groupe.',
            'group_ids.min' => 'Veuillez sÃ©lectionner au moins un groupe.',
        ]);

        $result = DB::transaction(function () use ($validated) {
            $groupIds = $this->validateGroupAssignments((int) $validated['filiere_id'], $validated['group_ids']);

            $user = User::create([
                'name' => $this->buildDisplayName($validated),
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'address' => $validated['address'],
                'password' => Hash::make($validated['password']),
                'role' => 'professeur',
                'is_active' => true,
            ]);

            $professeur = Professeur::create([
                'user_id' => $user->id,
                'specialite' => $validated['specialite'],
                'filiere_id' => $validated['filiere_id'],
            ]);

            $professeur->groupes()->sync($groupIds);

            return $professeur->fresh()->load(['user', 'filier', 'groupes.filiere']);
        });

        return response()->json($result, 201);
    }

    public function show(Professeur $professeur): JsonResponse
    {
        $professeur->load(['user', 'filier', 'groupes.filiere']);

        return response()->json($professeur);
    }

    public function update(Request $request, Professeur $professeur): JsonResponse
    {
        $validated = $request->validate([
            'is_active' => ['sometimes', 'boolean'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ]);

        $userData = [];

        if (array_key_exists('is_active', $validated)) {
            $userData['is_active'] = $validated['is_active'];
        }

        if (! empty($validated['password'])) {
            $userData['password'] = Hash::make($validated['password']);
        }

        if (! empty($userData)) {
            $professeur->user()->update($userData);
        }

        return response()->json($professeur->fresh()->load(['user', 'filier', 'groupes.filiere']));
    }

    public function destroy(Professeur $professeur): JsonResponse
    {
        DB::transaction(function () use ($professeur) {
            $user = $professeur->user;
            $professeur->delete();
            if ($user) {
                $user->delete();
            }
        });

        return response()->json(null, 204);
    }

    /**
     * @param array<int, int|string> $groupIds
     * @return array<int, int>
     */
    private function validateGroupAssignments(int $filiereId, array $groupIds): array
    {
        $normalizedGroupIds = collect($groupIds)
            ->map(fn ($groupId) => (int) $groupId)
            ->unique()
            ->values();

        $allowedGroupIds = Groupe::query()
            ->where('filiere_id', $filiereId)
            ->whereIn('id', $normalizedGroupIds->all())
            ->pluck('id')
            ->map(fn ($groupId) => (int) $groupId)
            ->all();

        if (count($allowedGroupIds) !== $normalizedGroupIds->count()) {
            throw ValidationException::withMessages([
                'group_ids' => ['Les groupes sélectionnés doivent appartenir à la formation choisie.'],
            ]);
        }

        return $allowedGroupIds;
    }
}
