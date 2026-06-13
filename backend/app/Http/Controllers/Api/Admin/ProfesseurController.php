<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Groupe;
use App\Models\Module;
use App\Models\Professeur;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
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
        $professeurs = Professeur::with(['user', 'groupes.filiere', 'modules.filiere'])->paginate($perPage);

        return response()->json($professeurs);
    }

    public function store(Request $request): JsonResponse
    {
        $payload = $this->normalizeAssignmentPayload($request);

        $validated = Validator::make($payload, [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string'],
            'groups' => ['required', 'array', 'min:1'],
            'groups.*' => ['integer', 'distinct', 'exists:groupes,id'],
            'modules' => ['required', 'array', 'min:1'],
            'modules.*' => ['integer', 'distinct', 'exists:modules,id'],
            'password' => ['required', 'string', 'min:8'],
        ], [
            'groups.required' => 'Au moins un groupe est obligatoire.',
            'groups.min' => 'Au moins un groupe est obligatoire.',
            'modules.required' => 'Au moins un module est obligatoire.',
            'modules.min' => 'Au moins un module est obligatoire.',
        ])->validate();

        $result = DB::transaction(function () use ($validated) {
            $groupIds = $this->validateGroupAssignments($validated['groups']);
            $moduleIds = $this->validateModuleAssignments($validated['modules']);

            $user = User::create([
                'name' => $this->buildDisplayName($validated),
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
                'password' => Hash::make($validated['password']),
                'role' => 'professeur',
                'is_active' => true,
            ]);

            $professeur = Professeur::create([
                'user_id' => $user->id,
                'specialite' => $this->resolveSpecialiteFromModules($moduleIds),
            ]);

            $professeur->groupes()->sync($groupIds);
            $professeur->modules()->sync($moduleIds);

            return $professeur->fresh()->load(['user', 'groupes.filiere', 'modules.filiere']);
        });

        return response()->json($result, 201);
    }

    public function show(Professeur $professeur): JsonResponse
    {
        $professeur->load(['user', 'groupes.filiere', 'modules.filiere']);

        return response()->json($professeur);
    }

    public function update(Request $request, Professeur $professeur): JsonResponse
    {
        $payload = $this->normalizeAssignmentPayload($request);

        $rules = [
            'is_active' => ['sometimes', 'boolean'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ];

        $messages = [];

        if (array_key_exists('groups', $payload)) {
            $rules['groups'] = ['required', 'array', 'min:1'];
            $rules['groups.*'] = ['integer', 'distinct', 'exists:groupes,id'];
            $messages['groups.required'] = 'Au moins un groupe est obligatoire.';
            $messages['groups.min'] = 'Au moins un groupe est obligatoire.';
        }

        if (array_key_exists('modules', $payload)) {
            $rules['modules'] = ['required', 'array', 'min:1'];
            $rules['modules.*'] = ['integer', 'distinct', 'exists:modules,id'];
            $messages['modules.required'] = 'Au moins un module est obligatoire.';
            $messages['modules.min'] = 'Au moins un module est obligatoire.';
        }

        $validated = Validator::make($payload, $rules, $messages)->validate();

        $userData = [];

        if (array_key_exists('is_active', $validated)) {
            $userData['is_active'] = $validated['is_active'];
        }

        if (! empty($validated['password'])) {
            $userData['password'] = Hash::make($validated['password']);
        }

        DB::transaction(function () use ($professeur, $validated, $userData) {
            if (array_key_exists('groups', $validated)) {
                $groupIds = $this->validateGroupAssignments($validated['groups']);
                $professeur->groupes()->sync($groupIds);
            }

            if (array_key_exists('modules', $validated)) {
                $moduleIds = $this->validateModuleAssignments($validated['modules']);
                $professeur->modules()->sync($moduleIds);
                $professeur->specialite = $this->resolveSpecialiteFromModules($moduleIds);
                $professeur->save();
            }

            if (! empty($userData)) {
                $professeur->user()->update($userData);
            }
        });

        return response()->json($professeur->fresh()->load(['user', 'groupes.filiere', 'modules.filiere']));
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
    private function validateGroupAssignments(array $groupIds): array
    {
        $normalizedGroupIds = collect($groupIds)
            ->map(fn ($groupId) => (int) $groupId)
            ->unique()
            ->values();

        $allowedGroupIds = Groupe::query()
            ->whereIn('id', $normalizedGroupIds->all())
            ->pluck('id')
            ->map(fn ($groupId) => (int) $groupId)
            ->all();

        if (count($allowedGroupIds) !== $normalizedGroupIds->count()) {
            throw ValidationException::withMessages([
                'groups' => ['Les groupes selectionnes sont invalides.'],
            ]);
        }

        return $allowedGroupIds;
    }

    /**
     * @param array<int, int|string> $moduleIds
     * @return array<int, int>
     */
    private function validateModuleAssignments(array $moduleIds): array
    {
        $normalizedModuleIds = collect($moduleIds)
            ->map(fn ($moduleId) => (int) $moduleId)
            ->unique()
            ->values();

        $allowedModuleIds = Module::query()
            ->whereIn('id', $normalizedModuleIds->all())
            ->pluck('id')
            ->map(fn ($moduleId) => (int) $moduleId)
            ->all();

        if (count($allowedModuleIds) !== $normalizedModuleIds->count()) {
            throw ValidationException::withMessages([
                'modules' => ['Les modules selectionnes sont invalides.'],
            ]);
        }

        return $allowedModuleIds;
    }

    /**
     * @param array<int, int> $moduleIds
     */
    private function resolveSpecialiteFromModules(array $moduleIds): ?string
    {
        $firstModuleId = $moduleIds[0] ?? null;

        if (! $firstModuleId) {
            return null;
        }

        return Module::query()
            ->whereKey($firstModuleId)
            ->value('nom');
    }

    private function normalizeAssignmentPayload(Request $request): array
    {
        $payload = $request->all();

        if ($request->hasAny(['groups', 'group_ids'])) {
            $payload['groups'] = $request->input('groups', $request->input('group_ids', []));
        }

        if ($request->hasAny(['modules', 'module_ids'])) {
            $payload['modules'] = $request->input('modules', $request->input('module_ids', []));
        }

        return $payload;
    }
}
