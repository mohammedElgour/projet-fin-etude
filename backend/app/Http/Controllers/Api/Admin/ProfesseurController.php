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
    public function index(): JsonResponse
    {
        $professeurs = Professeur::with('user')->paginate(15);

        return response()->json($professeurs);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $result = DB::transaction(function () use ($validated) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => 'professeur',
            ]);

            $professeur = Professeur::create([
                'user_id' => $user->id,
            ]);

            return $professeur->load('user');
        });

        return response()->json($result, 201);
    }

    public function show(Professeur $professeur): JsonResponse
    {
        $professeur->load('user');

        return response()->json($professeur);
    }

    public function update(Request $request, Professeur $professeur): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($professeur->user_id),
            ],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        DB::transaction(function () use ($validated, $professeur) {
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
                $professeur->user()->update($userData);
            }
        });

        return response()->json($professeur->fresh()->load('user'));
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
