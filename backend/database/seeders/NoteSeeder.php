<?php

namespace Database\Seeders;

use App\Models\Note;
use Database\Factories\NoteFactory;
use Illuminate\Database\Seeder;

class NoteSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Note::factory(20)->create();
    }
}

