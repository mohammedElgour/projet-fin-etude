<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('note_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('note_id')->nullable()->constrained('notes')->nullOnDelete();
            $table->foreignId('submission_id')->nullable()->constrained('note_submissions')->nullOnDelete();
            $table->foreignId('stagiaire_id')->nullable()->constrained('stagiaires')->nullOnDelete();
            $table->foreignId('module_id')->nullable()->constrained('modules')->nullOnDelete();
            $table->string('component', 50);
            $table->text('old_value')->nullable();
            $table->text('new_value')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 30);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('note_history');
    }
};
