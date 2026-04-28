<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->string('validation_status', 20)->default('pending')->after('is_validated');
            $table->text('feedback')->nullable()->after('validation_status');
            $table->timestamp('reviewed_at')->nullable()->after('feedback');

            $table->index('validation_status');
        });
    }

    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->dropIndex(['validation_status']);
            $table->dropColumn(['validation_status', 'feedback', 'reviewed_at']);
        });
    }
};
