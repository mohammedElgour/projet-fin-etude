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
            if (! Schema::hasColumn('notes', 'controle1_status')) {
                $table->string('controle1_status', 20)->default('draft')->after('efm');
            }

            if (! Schema::hasColumn('notes', 'controle2_status')) {
                $table->string('controle2_status', 20)->default('draft')->after('controle1_status');
            }

            if (! Schema::hasColumn('notes', 'controle3_status')) {
                $table->string('controle3_status', 20)->default('draft')->after('controle2_status');
            }

            if (! Schema::hasColumn('notes', 'efm_status')) {
                $table->string('efm_status', 20)->default('draft')->after('controle3_status');
            }
        });

        if (
            ! Schema::hasColumn('notes', 'controle1_status')
            || ! Schema::hasColumn('notes', 'controle2_status')
            || ! Schema::hasColumn('notes', 'controle3_status')
            || ! Schema::hasColumn('notes', 'efm_status')
        ) {
            return;
        }

        DB::table('notes')->orderBy('id')->chunkById(500, function ($notes): void {
            foreach ($notes as $note) {
                $normalized = $this->normalizeWorkflowStatus($note->status ?? $note->validation_status ?? null);

                DB::table('notes')
                    ->where('id', $note->id)
                    ->update([
                        'controle1_status' => $normalized,
                        'controle2_status' => $normalized,
                        'controle3_status' => $normalized,
                        'efm_status' => $normalized,
                        'validation_status' => $normalized,
                        'status' => Schema::hasColumn('notes', 'status')
                            ? ($normalized === 'approved' ? 'validated' : $normalized)
                            : null,
                        'is_validated' => $normalized === 'approved',
                    ]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $columns = array_filter([
                Schema::hasColumn('notes', 'controle1_status') ? 'controle1_status' : null,
                Schema::hasColumn('notes', 'controle2_status') ? 'controle2_status' : null,
                Schema::hasColumn('notes', 'controle3_status') ? 'controle3_status' : null,
                Schema::hasColumn('notes', 'efm_status') ? 'efm_status' : null,
            ]);

            if (! empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }

    private function normalizeWorkflowStatus(?string $status): string
    {
        return match ($status) {
            'approved', 'validated' => 'approved',
            'rejected' => 'rejected',
            'submitted', 'pending' => 'submitted',
            default => 'draft',
        };
    }
};
