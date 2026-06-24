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
            $table->decimal('cc1', 4, 2)->nullable()->after('module_id');
            $table->decimal('cc2', 4, 2)->nullable()->after('cc1');
            $table->decimal('cc3', 4, 2)->nullable()->after('cc2');
            $table->decimal('efm', 4, 2)->nullable()->after('cc3');
        });

        DB::table('notes')
            ->whereNull('cc1')
            ->update([
                'cc1' => DB::raw('note'),
                'cc2' => DB::raw('note'),
                'cc3' => DB::raw('note'),
                'efm' => DB::raw('note'),
            ]);
    }

    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->dropColumn(['cc1', 'cc2', 'cc3', 'efm']);
        });
    }
};
