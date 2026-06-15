<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('note_submissions', function (Blueprint $table) {
            if (!Schema::hasColumn('note_submissions', 'evaluation_type')) {
                $table->string('evaluation_type', 20)->nullable()->after('module_id');
            }

            $table->index(['evaluation_type', 'status', 'submitted_at']);
            $table->unique(['groupe_id', 'module_id', 'evaluation_type']);
        });
    }

    public function down(): void
    {
        Schema::table('note_submissions', function (Blueprint $table) {
            $table->dropUnique(['groupe_id', 'module_id', 'evaluation_type']);
            $table->dropIndex(['evaluation_type', 'status', 'submitted_at']);

            if (Schema::hasColumn('note_submissions', 'evaluation_type')) {
                $table->dropColumn('evaluation_type');
            }
        });
    }
};
