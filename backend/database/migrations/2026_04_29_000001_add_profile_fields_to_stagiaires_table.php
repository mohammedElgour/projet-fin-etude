<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stagiaires', function (Blueprint $table) {
            $table->string('cin')->nullable()->unique()->after('groupe_id');
            $table->string('phone')->nullable()->after('cin');
            $table->text('address')->nullable()->after('phone');
            $table->date('birth_date')->nullable()->after('address');
            $table->string('status', 20)->default('active')->after('birth_date');
        });
    }

    public function down(): void
    {
        Schema::table('stagiaires', function (Blueprint $table) {
            $table->dropUnique(['cin']);
            $table->dropColumn(['cin', 'phone', 'address', 'birth_date', 'status']);
        });
    }
};
