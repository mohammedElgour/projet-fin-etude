<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('groupes', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->foreignId('filiere_id')->constrained('filiers')->onDelete('cascade');
            $table->timestamps();

            $table->index(['filiere_id', 'nom']);
            $table->unique(['filiere_id', 'nom']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('groupes');
    }
};

