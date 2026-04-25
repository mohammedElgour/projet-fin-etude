<?php

namespace Database\Seeders;

use App\Models\Module;
use Database\Factories\ModuleFactory;
use Illuminate\Database\Seeder;

class ModuleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Module::factory(4)->create();
    }
}

