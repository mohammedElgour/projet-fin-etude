<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('professeurs', 'filiere_id')) {
            return;
        }

        Schema::table('professeurs', function (Blueprint $table) {
            $table->foreignId('filiere_id')->nullable()->after('specialite')->constrained('filiers')->nullOnDelete();
            $table->index('filiere_id');
        });
    }

    public function down(): void
    {
        if (!Schema::hasColumn('professeurs', 'filiere_id')) {
            return;
        }

        Schema::table('professeurs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('filiere_id');
        });
    }
};
