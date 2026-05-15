<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Professeur;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class ProfesseurController extends Controller
{
    private function buildDisplayName(array $validated, ?User $user = null): string
    {
        $firstName = $validated['first_name'] ?? $user?->first_name ?? '';
        $lastName = $validated['last_name'] ?? $user?->last_name ?? '';

        return trim($firstName.' '.$lastName);
    }

    public function index(): JsonResponse
    {
        $professeurs = Professeur::with(['user', 'filier'])->paginate(15);

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
            'password' => ['required', 'string', 'min:8'],
        ]);

        $result = DB::transaction(function () use ($validated) {
            $user = User::create([
                'name' => $this->buildDisplayName($validated),
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'address' => $validated['address'],
                'password' => Hash::make($validated['password']),
                'role' => 'professeur',
            ]);

            $professeur = Professeur::create([
                'user_id' => $user->id,
                'specialite' => $validated['specialite'],
                'filiere_id' => $validated['filiere_id'],
            ]);

            return $professeur->load(['user', 'filier']);
        });

        return response()->json($result, 201);
    }

    public function show(Professeur $professeur): JsonResponse
    {
        $professeur->load(['user', 'filier']);

        return response()->json($professeur);
    }

    public function update(Request $request, Professeur $professeur): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => ['sometimes', 'required', 'string', 'max:255'],
            'last_name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($professeur->user_id),
            ],
            'phone' => ['sometimes', 'required', 'string', 'max:30'],
            'address' => ['sometimes', 'required', 'string'],
            'filiere_id' => ['sometimes', 'required', 'exists:filiers,id'],
            'specialite' => ['sometimes', 'required', 'string', 'max:255'],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        DB::transaction(function () use ($validated, $professeur) {
            $userData = [];

            foreach (['first_name', 'last_name', 'email', 'phone', 'address'] as $field) {
                if (array_key_exists($field, $validated)) {
                    $userData[$field] = $validated[$field];
                }
            }

            if (!empty($validated['password'])) {
                $userData['password'] = Hash::make($validated['password']);
            }

            if (array_key_exists('first_name', $userData) || array_key_exists('last_name', $userData)) {
                $userData['name'] = $this->buildDisplayName($validated, $professeur->user);
            }

            if (!empty($userData)) {
                $professeur->user()->update($userData);
            }

            if (array_key_exists('specialite', $validated) || array_key_exists('filiere_id', $validated)) {
                $professeur->update([
                    'specialite' => $validated['specialite'] ?? $professeur->specialite,
                    'filiere_id' => $validated['filiere_id'] ?? $professeur->filiere_id,
                ]);
            }
        });

        return response()->json($professeur->fresh()->load(['user', 'filier']));
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
}
