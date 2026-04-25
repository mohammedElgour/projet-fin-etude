<?php

namespace Database\Seeders;

use App\Models\Professeur;
use Database\Factories\ProfesseurFactory;
use Illuminate\Database\Seeder;

class ProfesseurSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Professeur::factory(4)->create();
    }
}

