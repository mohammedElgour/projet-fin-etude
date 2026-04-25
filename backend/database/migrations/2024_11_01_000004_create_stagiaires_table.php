<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stagiaires', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade')->unique();
            $table->foreignId('groupe_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            $table->index('groupe_id');
            $table->unique(['user_id', 'groupe_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stagiaires');
    }
};

