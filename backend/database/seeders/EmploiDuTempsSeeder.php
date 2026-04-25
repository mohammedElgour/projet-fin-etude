<?php

namespace Database\Seeders;

use App\Models\EmploiDuTemps;
use Database\Factories\EmploiDuTempsFactory;
use Illuminate\Database\Seeder;

class EmploiDuTempsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        EmploiDuTemps::factory(4)->create();
    }
}

