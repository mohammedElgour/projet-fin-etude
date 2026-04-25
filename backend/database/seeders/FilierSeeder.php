<?php

namespace Database\Seeders;

use App\Models\Filier;
use Database\Factories\FilierFactory;
use Illuminate\Database\Seeder;

class FilierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Filier::factory(2)->create();
    }
}
