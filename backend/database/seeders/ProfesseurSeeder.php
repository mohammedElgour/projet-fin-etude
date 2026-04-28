<?php

namespace Database\Seeders;

use App\Models\Professeur;
use App\Models\User;
use Illuminate\Database\Seeder;

class ProfesseurSeeder extends Seeder
{
    public function run(): void
    {
        $professorUsers = User::where('role', 'professeur')->get();

        foreach ($professorUsers as $user) {
            Professeur::firstOrCreate([
                'user_id' => $user->id,
            ]);
        }
    }
}
