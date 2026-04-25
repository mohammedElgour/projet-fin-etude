<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('emplois_du_temps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('groupe_id')->constrained()->onDelete('cascade');
            $table->json('fichier');
            $table->date('date');
            $table->timestamps();

            $table->index(['groupe_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('emplois_du_temps');
    }
};

