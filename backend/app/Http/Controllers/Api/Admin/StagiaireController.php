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
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'filiere_id' => ['nullable', 'integer', 'exists:filiers,id'],
            'groupe_id' => ['nullable', 'integer', 'exists:groupes,id'],
            'status' => ['nullable', 'in:active,inactive'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'sort_by' => ['nullable', 'in:created_at,status,cin,name,email'],
            'sort_dir' => ['nullable', 'in:asc,desc'],
        ]);

        $perPage = $validated['per_page'] ?? 10;
        $search = trim((string) ($validated['search'] ?? ''));
        $sortBy = $validated['sort_by'] ?? 'created_at';
        $sortDir = $validated['sort_dir'] ?? 'desc';

        $stagiairesQuery = Stagiaire::query()
            ->with(['user', 'groupe.filier'])
            ->withCount('notes')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($nestedQuery) use ($search) {
                    $nestedQuery
                        ->where('cin', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($userQuery) use ($search) {
                            $userQuery
                                ->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                    $nestedQuery->orWhereHas('groupe', function ($groupeQuery) use ($search) {
                        $groupeQuery
                            ->where('nom', 'like', "%{$search}%")
                            ->orWhereHas('filier', function ($filiereQuery) use ($search) {
                                $filiereQuery->where('nom', 'like', "%{$search}%");
                            });
                    });
                });
            })
            ->when(!empty($validated['filiere_id']), function ($query) use ($validated) {
                $query->whereHas('groupe', function ($groupeQuery) use ($validated) {
                    $groupeQuery->where('filiere_id', $validated['filiere_id']);
                });
            })
            ->when(!empty($validated['groupe_id']), function ($query) use ($validated) {
                $query->where('groupe_id', $validated['groupe_id']);
            })
            ->when(!empty($validated['status']), function ($query) use ($validated) {
                $query->where('status', $validated['status']);
            });

        if (in_array($sortBy, ['name', 'email'], true)) {
            $stagiairesQuery
                ->join('users', 'stagiaires.user_id', '=', 'users.id')
                ->select('stagiaires.*')
                ->orderBy("users.{$sortBy}", $sortDir);
        } else {
            $stagiairesQuery->orderBy("stagiaires.{$sortBy}", $sortDir);
        }

        $stagiaires = $stagiairesQuery
            ->paginate($perPage)
            ->appends($request->query());

        return response()->json($stagiaires);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'groupe_id' => ['required', 'exists:groupes,id'],
            'cin' => ['nullable', 'string', 'max:50', 'unique:stagiaires,cin'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:1000'],
            'birth_date' => ['nullable', 'date'],
            'status' => ['nullable', 'in:active,inactive'],
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
                'cin' => $validated['cin'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
                'birth_date' => $validated['birth_date'] ?? null,
                'status' => $validated['status'] ?? 'active',
            ]);

            return $stagiaire->load(['user', 'groupe.filier'])->loadCount('notes');
        });

        return response()->json($result, 201);
    }

    public function show(Stagiaire $stagiaire): JsonResponse
    {
        $stagiaire->load(['user', 'groupe.filier', 'notes.module'])->loadCount('notes');

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
            'cin' => [
                'sometimes',
                'nullable',
                'string',
                'max:50',
                Rule::unique('stagiaires', 'cin')->ignore($stagiaire->id),
            ],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'address' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'birth_date' => ['sometimes', 'nullable', 'date'],
            'status' => ['sometimes', 'required', 'in:active,inactive'],
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

            $stagiaireData = [];

            foreach (['groupe_id', 'cin', 'phone', 'address', 'birth_date', 'status'] as $field) {
                if (array_key_exists($field, $validated)) {
                    $stagiaireData[$field] = $validated[$field];
                }
            }

            if (!empty($stagiaireData)) {
                $stagiaire->update($stagiaireData);
            }
        });

        return response()->json($stagiaire->fresh()->load(['user', 'groupe.filier'])->loadCount('notes'));
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
