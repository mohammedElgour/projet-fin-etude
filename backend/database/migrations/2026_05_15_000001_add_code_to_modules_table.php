<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('modules', 'code')) {
            return;
        }

        Schema::table('modules', function (Blueprint $table) {
            $table->string('code', 50)->nullable()->after('id');
            $table->index(['filiere_id', 'code']);
        });
    }

    public function down(): void
    {
        if (!Schema::hasColumn('modules', 'code')) {
            return;
        }

        Schema::table('modules', function (Blueprint $table) {
            $table->dropIndex(['filiere_id', 'code']);
            $table->dropColumn('code');
        });
    }
};
