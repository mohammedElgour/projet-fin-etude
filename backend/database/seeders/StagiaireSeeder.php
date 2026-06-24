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
            ['first_name' => 'Sara', 'last_name' => 'El Idrissi', 'email' => 'sara@ista.test', 'phone' => '+212 6 45 11 29 03', 'address' => 'Sidi Maarouf, Casablanca', 'date_of_birth' => '2003-05-12', 'groupe' => 'DD101'],
            ['first_name' => 'Youssef', 'last_name' => 'Amrani', 'email' => 'youssef@ista.test', 'phone' => '+212 6 56 18 40 77', 'address' => 'Hay Riad, Rabat', 'date_of_birth' => '2002-11-04', 'groupe' => 'DD101'],
            ['first_name' => 'Imane', 'last_name' => 'Bennis', 'email' => 'imane@ista.test', 'phone' => '+212 6 67 22 15 48', 'address' => 'Gueliz, Marrakech', 'date_of_birth' => '2003-01-19', 'groupe' => 'DD102'],
            ['first_name' => 'Hamza', 'last_name' => 'Alaoui', 'email' => 'hamza@ista.test', 'phone' => '+212 6 70 39 84 16', 'address' => 'Bourgogne, Casablanca', 'date_of_birth' => '2002-08-27', 'groupe' => 'DD102'],
            ['first_name' => 'Salma', 'last_name' => 'Tazi', 'email' => 'salma@ista.test', 'phone' => '+212 6 51 07 63 25', 'address' => 'Agdal, Rabat', 'date_of_birth' => '2003-03-08', 'groupe' => 'ID201'],
            ['first_name' => 'Anas', 'last_name' => 'Chraibi', 'email' => 'anas@ista.test', 'phone' => '+212 6 31 75 20 94', 'address' => 'Centre-ville, Tanger', 'date_of_birth' => '2002-12-16', 'groupe' => 'ID201'],
            ['first_name' => 'Hajar', 'last_name' => 'Benjelloun', 'email' => 'hajar@ista.test', 'phone' => '+212 6 58 22 90 13', 'address' => 'Hay Atlas, Fès', 'date_of_birth' => '2003-02-18', 'groupe' => 'DD103'],
            ['first_name' => 'Said', 'last_name' => 'El Idrissi', 'email' => 'said@ista.test', 'phone' => '+212 6 79 31 44 06', 'address' => 'Mimosas, Kenitra', 'date_of_birth' => '2002-05-07', 'groupe' => 'DD103'],
            ['first_name' => 'Meriem', 'last_name' => 'Ait Baha', 'email' => 'meriem@ista.test', 'phone' => '+212 6 60 29 51 88', 'address' => 'Hay Mohammadi, Agadir', 'date_of_birth' => '2003-07-21', 'groupe' => 'ID201'],
            ['first_name' => 'Omar', 'last_name' => 'Bennani', 'email' => 'omar@ista.test', 'phone' => '+212 6 44 63 10 52', 'address' => 'Médina, Fès', 'date_of_birth' => '2002-09-14', 'groupe' => 'ID201'],
            ['first_name' => 'Khadija', 'last_name' => 'Mouline', 'email' => 'khadija@ista.test', 'phone' => '+212 6 24 88 41 70', 'address' => 'Sala Al Jadida, Salé', 'date_of_birth' => '2003-10-30', 'groupe' => 'ID202'],
            ['first_name' => 'Ismail', 'last_name' => 'Ziyadi', 'email' => 'ismail@ista.test', 'phone' => '+212 6 73 14 95 36', 'address' => 'Quartier Al Qods, Oujda', 'date_of_birth' => '2002-04-11', 'groupe' => 'ID202'],
            ['first_name' => 'Aya', 'last_name' => 'Lahlou', 'email' => 'aya@ista.test', 'phone' => '+212 6 57 29 08 41', 'address' => 'Bni Makada, Tanger', 'date_of_birth' => '2003-06-25', 'groupe' => 'GE301'],
            ['first_name' => 'Ayoub', 'last_name' => 'El Khatib', 'email' => 'ayoub@ista.test', 'phone' => '+212 6 83 17 62 05', 'address' => 'Hay Salam, Meknes', 'date_of_birth' => '2002-02-20', 'groupe' => 'GE301'],
            ['first_name' => 'Nisrine', 'last_name' => 'Cherkaoui', 'email' => 'nisrine@ista.test', 'phone' => '+212 6 69 45 81 23', 'address' => 'Hay Hassani, Casablanca', 'date_of_birth' => '2003-12-02', 'groupe' => 'GED401'],
            ['first_name' => 'Mohamed', 'last_name' => 'El Ghazali', 'email' => 'mohamed@ista.test', 'phone' => '+212 6 41 72 34 19', 'address' => 'Aswak Assalam, Meknes', 'date_of_birth' => '2002-07-09', 'groupe' => 'GED401'],
            ['first_name' => 'Houda', 'last_name' => 'Benali', 'email' => 'houda@ista.test', 'phone' => '+212 6 28 63 97 54', 'address' => 'Medina, Marrakech', 'date_of_birth' => '2003-04-17', 'groupe' => 'DDES501'],
            ['first_name' => 'Bilal', 'last_name' => 'Ait Yassine', 'email' => 'bilal@ista.test', 'phone' => '+212 6 90 54 11 68', 'address' => 'Gauthier, Casablanca', 'date_of_birth' => '2002-06-06', 'groupe' => 'DDES501'],
            ['first_name' => 'Asmae', 'last_name' => 'Mernissi', 'email' => 'asmae@ista.test', 'phone' => '+212 6 52 38 60 27', 'address' => 'Inezgane, Agadir', 'date_of_birth' => '2003-09-23', 'groupe' => 'THI601'],
            ['first_name' => 'Reda', 'last_name' => 'Bouziane', 'email' => 'reda@ista.test', 'phone' => '+212 6 74 19 52 80', 'address' => 'Beni Makada, Tanger', 'date_of_birth' => '2002-01-28', 'groupe' => 'THI601'],
            ['first_name' => 'Fatima Zahra', 'last_name' => 'Mahi', 'email' => 'fatimazahra@ista.test', 'phone' => '+212 6 35 26 74 91', 'address' => 'Hay Al Inbiat, Rabat', 'date_of_birth' => '2003-11-11', 'groupe' => 'GC701'],
            ['first_name' => 'Walid', 'last_name' => 'Kabbaj', 'email' => 'walid@ista.test', 'phone' => '+212 6 43 80 25 37', 'address' => 'Hay Mohammadi, Casablanca', 'date_of_birth' => '2002-10-05', 'groupe' => 'GC701'],
        ];

        $groups = Groupe::get()->keyBy('nom');

        foreach ($students as $student) {
            $user = User::updateOrCreate(
                ['email' => $student['email']],
                [
                    'name' => trim($student['first_name'].' '.$student['last_name']),
                    'first_name' => $student['first_name'],
                    'last_name' => $student['last_name'],
                    'phone' => $student['phone'],
                    'address' => $student['address'],
                    'date_of_birth' => $student['date_of_birth'],
                    'password' => Hash::make('password123'),
                    'role' => 'stagiaire',
                    'is_active' => true,
                ]
            );

            Stagiaire::updateOrCreate(
                ['user_id' => $user->id],
                ['groupe_id' => $groups[$student['groupe']]->id]
            );
        }
    }
}
