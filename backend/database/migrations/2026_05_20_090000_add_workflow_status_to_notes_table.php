<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->enum('status', ['draft', 'submitted', 'validated', 'rejected'])
                ->default('draft')
                ->after('note');
        });

        DB::table('notes')->update([
            'status' => DB::raw("
                CASE
                    WHEN validation_status = 'validated' THEN 'validated'
                    WHEN validation_status = 'rejected' THEN 'rejected'
                    WHEN validation_status IN ('pending', 'submitted') THEN 'submitted'
                    WHEN validation_status = 'draft' THEN 'draft'
                    ELSE 'draft'
                END
            "),
        ]);

        Schema::table('notes', function (Blueprint $table) {
            $table->decimal('note', 4, 2)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->dropColumn('status');
            $table->decimal('note', 4, 2)->nullable(false)->change();
        });
    }
};
