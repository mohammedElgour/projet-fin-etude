<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            FilierSeeder::class,
            GroupeSeeder::class,
            ModuleSeeder::class,
            UserSeeder::class,
            StagiaireSeeder::class,
            ProfesseurSeeder::class,
            NoteSeeder::class,
            EmploiDuTempsSeeder::class,
            NotificationSeeder::class,
        ]);
    }
}
