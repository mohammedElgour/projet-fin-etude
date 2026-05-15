<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Stagiaire;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class StagiaireController extends Controller
{
    private function buildDisplayName(array $validated, ?User $user = null): string
    {
        $firstName = $validated['first_name'] ?? $user?->first_name ?? '';
        $lastName = $validated['last_name'] ?? $user?->last_name ?? '';

        return trim($firstName.' '.$lastName);
    }

    public function index(): JsonResponse
    {
        $stagiaires = Stagiaire::with(['user', 'groupe.filier'])->paginate(15);

        return response()->json($stagiaires);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:30'],
            'address' => ['required', 'string'],
            'date_of_birth' => ['required', 'date'],
            'password' => ['required', 'string', 'min:8'],
            'groupe_id' => ['required', 'exists:groupes,id'],
        ]);

        $result = DB::transaction(function () use ($validated) {
            $user = User::create([
                'name' => $this->buildDisplayName($validated),
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'address' => $validated['address'],
                'date_of_birth' => $validated['date_of_birth'],
                'password' => Hash::make($validated['password']),
                'role' => 'stagiaire',
            ]);

            $stagiaire = Stagiaire::create([
                'user_id' => $user->id,
                'groupe_id' => $validated['groupe_id'],
            ]);

            return $stagiaire->load(['user', 'groupe.filier']);
        });

        return response()->json($result, 201);
    }

    public function show(Stagiaire $stagiaire): JsonResponse
    {
        $stagiaire->load(['user', 'groupe.filier', 'notes.module']);

        return response()->json($stagiaire);
    }

    public function update(Request $request, Stagiaire $stagiaire): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => ['sometimes', 'required', 'string', 'max:255'],
            'last_name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($stagiaire->user_id),
            ],
            'phone' => ['sometimes', 'required', 'string', 'max:30'],
            'address' => ['sometimes', 'required', 'string'],
            'date_of_birth' => ['sometimes', 'required', 'date'],
            'password' => ['nullable', 'string', 'min:8'],
            'groupe_id' => ['sometimes', 'required', 'exists:groupes,id'],
        ]);

        DB::transaction(function () use ($validated, $stagiaire) {
            $userData = [];

            foreach (['first_name', 'last_name', 'email', 'phone', 'address', 'date_of_birth'] as $field) {
                if (array_key_exists($field, $validated)) {
                    $userData[$field] = $validated[$field];
                }
            }

            if (!empty($validated['password'])) {
                $userData['password'] = Hash::make($validated['password']);
            }

            if (array_key_exists('first_name', $userData) || array_key_exists('last_name', $userData)) {
                $userData['name'] = $this->buildDisplayName($validated, $stagiaire->user);
            }

            if (!empty($userData)) {
                $stagiaire->user()->update($userData);
            }

            if (array_key_exists('groupe_id', $validated)) {
                $stagiaire->update(['groupe_id' => $validated['groupe_id']]);
            }
        });

        return response()->json($stagiaire->fresh()->load(['user', 'groupe.filier']));
    }

    public function destroy(Stagiaire $stagiaire): JsonResponse
    {
        DB::transaction(function () use ($stagiaire) {
            $user = $stagiaire->user;
            $stagiaire->delete();
            if ($user) {
                $user->delete();
            }
        });

        return response()->json(null, 204);
    }
}
