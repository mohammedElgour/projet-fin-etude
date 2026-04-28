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
    public function index(): JsonResponse
    {
        $stagiaires = Stagiaire::with(['user', 'groupe.filier'])->paginate(15);

        return response()->json($stagiaires);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'groupe_id' => ['required', 'exists:groupes,id'],
        ]);

        $result = DB::transaction(function () use ($validated) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
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
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($stagiaire->user_id),
            ],
            'password' => ['nullable', 'string', 'min:8'],
            'groupe_id' => ['sometimes', 'required', 'exists:groupes,id'],
        ]);

        DB::transaction(function () use ($validated, $stagiaire) {
            $userData = [];
            if (array_key_exists('name', $validated)) {
                $userData['name'] = $validated['name'];
            }
            if (array_key_exists('email', $validated)) {
                $userData['email'] = $validated['email'];
            }
            if (!empty($validated['password'])) {
                $userData['password'] = Hash::make($validated['password']);
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
