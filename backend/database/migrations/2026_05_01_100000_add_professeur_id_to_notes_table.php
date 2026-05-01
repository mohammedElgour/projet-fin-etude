<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->foreignId('professeur_id')
                ->nullable()
                ->after('module_id')
                ->constrained('professeurs')
                ->nullOnDelete();

            $table->index(['professeur_id', 'validation_status'], 'notes_professeur_status_idx');
        });
    }

    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->dropIndex('notes_professeur_status_idx');
            $table->dropConstrainedForeignId('professeur_id');
        });
    }
};
