<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('professeur_module')) {
            return;
        }

        Schema::create('professeur_module', function (Blueprint $table) {
            $table->id();
            $table->foreignId('professeur_id')->constrained('professeurs')->cascadeOnDelete();
            $table->foreignId('module_id')->constrained('modules')->cascadeOnDelete();
            $table->timestamps();


            $table->unique(['professeur_id', 'module_id']);
        });
    }


    public function down(): void
    {
        Schema::dropIfExists('professeur_module');
    }
};

