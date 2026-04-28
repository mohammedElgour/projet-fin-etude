<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            ['name' => 'Directeur Demo', 'email' => 'admin@ista.test', 'role' => 'admin'],
            ['name' => 'Professeur Demo', 'email' => 'prof@ista.test', 'role' => 'professeur'],
            ['name' => 'Professeur Atelier', 'email' => 'prof2@ista.test', 'role' => 'professeur'],
        ] as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                [
                    'name' => $user['name'],
                    'password' => Hash::make('password123'),
                    'role' => $user['role'],
                ]
            );
        }
    }
}
