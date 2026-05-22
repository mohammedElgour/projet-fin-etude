<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('note_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('groupe_id')->constrained('groupes')->cascadeOnDelete();
            $table->foreignId('module_id')->constrained('modules')->cascadeOnDelete();
            $table->foreignId('teacher_id')->nullable()->constrained('professeurs')->nullOnDelete();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->text('admin_comment')->nullable();
            $table->timestamps();

            $table->unique(['groupe_id', 'module_id']);
            $table->index(['status', 'submitted_at']);
        });

        Schema::table('notes', function (Blueprint $table) {
            $table->foreignId('submission_id')
                ->nullable()
                ->after('id')
                ->constrained('note_submissions')
                ->cascadeOnDelete();

            $table->index(['submission_id', 'stagiaire_id']);
        });

        $this->backfillExistingNotes();
    }

    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->dropIndex(['submission_id', 'stagiaire_id']);
            $table->dropForeign(['submission_id']);
            $table->dropColumn('submission_id');
        });

        Schema::dropIfExists('note_submissions');
    }

    private function backfillExistingNotes(): void
    {
        if (!Schema::hasTable('notes') || !Schema::hasTable('stagiaires')) {
            return;
        }

        $groups = DB::table('notes')
            ->join('stagiaires', 'stagiaires.id', '=', 'notes.stagiaire_id')
            ->select('stagiaires.groupe_id', 'notes.module_id')
            ->distinct()
            ->get();

        foreach ($groups as $group) {
            $notes = DB::table('notes')
                ->join('stagiaires', 'stagiaires.id', '=', 'notes.stagiaire_id')
                ->where('stagiaires.groupe_id', $group->groupe_id)
                ->where('notes.module_id', $group->module_id)
                ->select([
                    'notes.id',
                    'notes.status',
                    'notes.validation_status',
                    'notes.reviewed_at',
                    'notes.updated_at',
                ])
                ->get();

            if ($notes->isEmpty()) {
                continue;
            }

            $derivedStatus = $this->deriveSubmissionStatus($notes);
            $hasSubmittedState = $notes->contains(fn (object $note) => $this->normalizeNoteStatus($note) !== 'draft');
            $submittedAt = $hasSubmittedState
                ? $notes
                    ->map(fn (object $note) => $note->updated_at)
                    ->filter()
                    ->sort()
                    ->first()
                : null;

            $approvedAt = $derivedStatus === 'approved'
                ? $notes
                    ->map(fn (object $note) => $note->reviewed_at ?: $note->updated_at)
                    ->filter()
                    ->sortDesc()
                    ->first()
                : null;

            $rejectedAt = $derivedStatus === 'rejected'
                ? $notes
                    ->map(fn (object $note) => $note->reviewed_at ?: $note->updated_at)
                    ->filter()
                    ->sortDesc()
                    ->first()
                : null;

            $submissionId = DB::table('note_submissions')->insertGetId([
                'groupe_id' => $group->groupe_id,
                'module_id' => $group->module_id,
                'teacher_id' => $this->resolveTeacherId((int) $group->groupe_id, (int) $group->module_id),
                'status' => $derivedStatus,
                'submitted_at' => $submittedAt,
                'approved_at' => $approvedAt,
                'rejected_at' => $rejectedAt,
                'admin_comment' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('notes')
                ->whereIn('id', $notes->pluck('id'))
                ->update(['submission_id' => $submissionId]);
        }
    }

    private function resolveTeacherId(int $groupeId, int $moduleId): ?int
    {
        if (!Schema::hasTable('professeur_groupe') || !Schema::hasTable('professeur_module')) {
            return null;
        }

        return DB::table('professeur_groupe')
            ->join('professeur_module', 'professeur_module.professeur_id', '=', 'professeur_groupe.professeur_id')
            ->where('professeur_groupe.groupe_id', $groupeId)
            ->where('professeur_module.module_id', $moduleId)
            ->value('professeur_groupe.professeur_id');
    }

    private function deriveSubmissionStatus(Collection $notes): string
    {
        $statuses = $notes
            ->map(fn (object $note) => $this->normalizeNoteStatus($note))
            ->unique()
            ->values();

        if ($statuses->contains('pending')) {
            return 'pending';
        }

        if ($statuses->contains('rejected')) {
            return 'rejected';
        }

        if ($statuses->contains('approved')) {
            return 'approved';
        }

        return 'pending';
    }

    private function normalizeNoteStatus(object $note): string
    {
        $status = $note->status ?: $note->validation_status;

        return match ($status) {
            'validated' => 'approved',
            'rejected' => 'rejected',
            'pending', 'submitted' => 'pending',
            default => 'draft',
        };
    }
};
