<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('note_submissions', function (Blueprint $table) {
            if (! Schema::hasColumn('note_submissions', 'cc1')) {
                $table->decimal('cc1', 4, 2)->nullable()->after('admin_comment');
            }

            if (! Schema::hasColumn('note_submissions', 'cc2')) {
                $table->decimal('cc2', 4, 2)->nullable()->after('cc1');
            }

            if (! Schema::hasColumn('note_submissions', 'cc3')) {
                $table->decimal('cc3', 4, 2)->nullable()->after('cc2');
            }

            if (! Schema::hasColumn('note_submissions', 'efm')) {
                $table->decimal('efm', 4, 2)->nullable()->after('cc3');
            }

            if (! Schema::hasColumn('note_submissions', 'final_grade')) {
                $table->decimal('final_grade', 4, 2)->nullable()->after('efm');
            }
        });
    }

    public function down(): void
    {
        Schema::table('note_submissions', function (Blueprint $table) {
            $columns = array_filter([
                Schema::hasColumn('note_submissions', 'cc1') ? 'cc1' : null,
                Schema::hasColumn('note_submissions', 'cc2') ? 'cc2' : null,
                Schema::hasColumn('note_submissions', 'cc3') ? 'cc3' : null,
                Schema::hasColumn('note_submissions', 'efm') ? 'efm' : null,
                Schema::hasColumn('note_submissions', 'final_grade') ? 'final_grade' : null,
            ]);

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
