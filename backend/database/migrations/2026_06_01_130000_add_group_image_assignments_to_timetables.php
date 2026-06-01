<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('timetables', function (Blueprint $table) {
            if (!Schema::hasColumn('timetables', 'uploaded_by')) {
                $table->foreignId('uploaded_by')->nullable()->after('image_path')->constrained('users')->nullOnDelete();
            }
        });

        if (Schema::hasColumn('timetables', 'created_by')) {
            DB::table('timetables')
                ->whereNull('uploaded_by')
                ->update(['uploaded_by' => DB::raw('created_by')]);
        }

        Schema::create('groupe_timetable', function (Blueprint $table) {
            $table->id();
            $table->foreignId('groupe_id')->constrained('groupes')->cascadeOnDelete();
            $table->foreignId('timetable_id')->constrained('timetables')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['groupe_id', 'timetable_id']);
            $table->index('timetable_id');
        });

        if (Schema::hasColumn('timetables', 'groupe_id')) {
            DB::table('timetables')
                ->whereNotNull('groupe_id')
                ->orderBy('id')
                ->get()
                ->each(function ($timetable) {
                    DB::table('groupe_timetable')->updateOrInsert(
                        [
                            'groupe_id' => $timetable->groupe_id,
                            'timetable_id' => $timetable->id,
                        ],
                        [
                            'created_at' => $timetable->created_at,
                            'updated_at' => $timetable->updated_at,
                        ]
                    );
                });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('groupe_timetable');

        Schema::table('timetables', function (Blueprint $table) {
            if (Schema::hasColumn('timetables', 'uploaded_by')) {
                $table->dropConstrainedForeignId('uploaded_by');
            }
        });
    }
};
