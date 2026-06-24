<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name' => 'Directeur Demo',
                'first_name' => 'Mouhcine',
                'last_name' => 'El Amrani',
                'email' => 'admin@ista.test',
                'phone' => '+212 6 61 20 45 11',
                'address' => 'Quartier Hassan, Rabat',
                'date_of_birth' => '1978-04-18',
                'role' => 'admin',
            ],
            [
                'name' => 'Rachid El Mansouri',
                'first_name' => 'Rachid',
                'last_name' => 'El Mansouri',
                'email' => 'prof@ista.test',
                'phone' => '+212 6 71 34 28 90',
                'address' => 'Maarif, Casablanca',
                'date_of_birth' => '1982-02-14',
                'role' => 'professeur',
            ],
            [
                'name' => 'Nadia El Fassi',
                'first_name' => 'Nadia',
                'last_name' => 'El Fassi',
                'email' => 'prof2@ista.test',
                'phone' => '+212 6 63 17 88 24',
                'address' => 'Agdal, Rabat',
                'date_of_birth' => '1985-09-03',
                'role' => 'professeur',
            ],
            [
                'name' => 'Youssef Berrada',
                'first_name' => 'Youssef',
                'last_name' => 'Berrada',
                'email' => 'prof3@ista.test',
                'phone' => '+212 6 54 90 12 67',
                'address' => 'Gueliz, Marrakech',
                'date_of_birth' => '1984-11-27',
                'role' => 'professeur',
            ],
            [
                'name' => 'Sanae Bouzidi',
                'first_name' => 'Sanae',
                'last_name' => 'Bouzidi',
                'email' => 'prof4@ista.test',
                'phone' => '+212 6 77 45 06 81',
                'address' => 'Route de Safi, Marrakech',
                'date_of_birth' => '1987-06-09',
                'role' => 'professeur',
            ],
            [
                'name' => 'Karim Ait Lahcen',
                'first_name' => 'Karim',
                'last_name' => 'Ait Lahcen',
                'email' => 'prof5@ista.test',
                'phone' => '+212 6 32 58 79 14',
                'address' => 'Centre-ville, Tanger',
                'date_of_birth' => '1981-12-01',
                'role' => 'professeur',
            ],
            [
                'name' => 'Meriem Azzouzi',
                'first_name' => 'Meriem',
                'last_name' => 'Azzouzi',
                'email' => 'prof6@ista.test',
                'phone' => '+212 6 28 61 33 42',
                'address' => 'Hay Salam, Agadir',
                'date_of_birth' => '1986-03-22',
                'role' => 'professeur',
            ],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                [
                    'name' => $user['name'],
                    'first_name' => $user['first_name'],
                    'last_name' => $user['last_name'],
                    'phone' => $user['phone'],
                    'address' => $user['address'],
                    'date_of_birth' => $user['date_of_birth'],
                    'password' => Hash::make('password123'),
                    'role' => $user['role'],
                    'is_active' => true,
                ]
            );
        }
    }
}
