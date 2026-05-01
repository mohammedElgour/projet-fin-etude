<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('emplois_du_temps', function (Blueprint $table) {
            $table->foreignId('module_id')->nullable()->after('groupe_id')->constrained('modules')->nullOnDelete();
            $table->foreignId('professeur_id')->nullable()->after('module_id')->constrained('professeurs')->nullOnDelete();
            $table->string('day_of_week', 20)->nullable()->after('date');
            $table->time('start_time')->nullable()->after('day_of_week');
            $table->time('end_time')->nullable()->after('start_time');
            $table->string('room')->nullable()->after('end_time');

            $table->index(['groupe_id', 'day_of_week', 'start_time'], 'edt_group_day_start_idx');
            $table->index(['professeur_id', 'day_of_week', 'start_time'], 'edt_prof_day_start_idx');
            $table->index(['module_id', 'day_of_week', 'start_time'], 'edt_module_day_start_idx');
        });
    }

    public function down(): void
    {
        Schema::table('emplois_du_temps', function (Blueprint $table) {
            $table->dropIndex('edt_group_day_start_idx');
            $table->dropIndex('edt_prof_day_start_idx');
            $table->dropIndex('edt_module_day_start_idx');
            $table->dropConstrainedForeignId('module_id');
            $table->dropConstrainedForeignId('professeur_id');
            $table->dropColumn(['day_of_week', 'start_time', 'end_time', 'room']);
        });
    }
};
