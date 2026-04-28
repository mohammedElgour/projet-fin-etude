<?php

namespace Database\Seeders;

use App\Models\Groupe;
use App\Models\Stagiaire;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class StagiaireSeeder extends Seeder
{
    public function run(): void
    {
        $students = [
            ['name' => 'Sara El Idrissi', 'email' => 'sara@ista.test', 'groupe' => 'DD101'],
            ['name' => 'Youssef Amrani', 'email' => 'youssef@ista.test', 'groupe' => 'DD101'],
            ['name' => 'Imane Bennis', 'email' => 'imane@ista.test', 'groupe' => 'DD102'],
            ['name' => 'Hamza Alaoui', 'email' => 'hamza@ista.test', 'groupe' => 'DD102'],
            ['name' => 'Salma Tazi', 'email' => 'salma@ista.test', 'groupe' => 'ID201'],
            ['name' => 'Anas Chraibi', 'email' => 'anas@ista.test', 'groupe' => 'ID201'],
        ];

        $groups = Groupe::get()->keyBy('nom');

        foreach ($students as $student) {
            $user = User::updateOrCreate(
                ['email' => $student['email']],
                [
                    'name' => $student['name'],
                    'password' => Hash::make('password123'),
                    'role' => 'stagiaire',
                ]
            );

            Stagiaire::updateOrCreate(
                ['user_id' => $user->id],
                ['groupe_id' => $groups[$student['groupe']]->id]
            );
        }
    }
}
