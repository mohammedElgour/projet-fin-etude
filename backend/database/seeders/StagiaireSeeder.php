<?php

namespace Database\Seeders;

use App\Models\Stagiaire;
use Database\Factories\StagiaireFactory;
use Illuminate\Database\Seeder;

class StagiaireSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Stagiaire::factory(8)->create();
    }
}

