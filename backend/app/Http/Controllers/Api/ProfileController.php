<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()->fresh(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30', 'regex:/^\+?[0-9][0-9\s().-]{6,19}$/'],
            'address' => ['required', 'string', 'max:1000'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'current_password' => ['nullable', 'required_with:new_password', 'current_password'],
            'new_password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'profile_photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $changedFlags = [
            'image_uploaded' => false,
            'password_changed' => false,
        ];

        if ($request->hasFile('profile_photo')) {
            if ($user->profile_photo_path) {
                Storage::disk('public')->delete($user->profile_photo_path);
            }

            $user->profile_photo_path = $request->file('profile_photo')->store('profile-photos', 'public');
            $changedFlags['image_uploaded'] = true;
        }

        $user->first_name = $validated['first_name'];
        $user->last_name = $validated['last_name'];
        $user->phone = $validated['phone'];
        $user->address = $validated['address'];
        $user->email = $validated['email'];
        $user->name = trim($validated['first_name'].' '.$validated['last_name']);

        if (! empty($validated['new_password'])) {
            $user->password = Hash::make($validated['new_password']);
            $changedFlags['password_changed'] = true;
        }

        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $user->fresh(),
            ...$changedFlags,
        ]);
    }
}
