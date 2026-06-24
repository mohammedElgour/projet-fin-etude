<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('professeurs', 'filiere_id')) {
            return;
        }

        Schema::table('professeurs', function (Blueprint $table) {
            $table->dropForeign(['filiere_id']);
        });

        Schema::table('professeurs', function (Blueprint $table) {
            $table->unsignedBigInteger('filiere_id')->nullable(false)->change();
            $table->foreign('filiere_id')->references('id')->on('filiers')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        if (!Schema::hasColumn('professeurs', 'filiere_id')) {
            return;
        }

        Schema::table('professeurs', function (Blueprint $table) {
            $table->dropForeign(['filiere_id']);
        });

        Schema::table('professeurs', function (Blueprint $table) {
            $table->unsignedBigInteger('filiere_id')->nullable()->change();
            $table->foreign('filiere_id')->references('id')->on('filiers')->nullOnDelete();
        });
    }
};

