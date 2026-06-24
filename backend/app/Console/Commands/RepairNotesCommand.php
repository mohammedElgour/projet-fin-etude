<?php

namespace App\Console\Commands;

use App\Models\Note;
use App\Models\NoteHistory;
use App\Models\NoteSubmission;
use App\Models\Stagiaire;
use App\Services\GradeWorkflowService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Throwable;

#[Signature('notes:repair')]
#[Description('Repairs broken grade links and restores notes from history when possible')]
class RepairNotesCommand extends Command
{
    public function __construct(private GradeWorkflowService $gradeWorkflow)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $report = [
            'repaired' => [],
            'unrecoverable' => [],
        ];

        DB::transaction(function () use (&$report): void {
            $historyByNote = NoteHistory::query()
                ->orderBy('id')
                ->get()
                ->groupBy('note_id');

            $brokenNotes = Note::query()
                ->with(['stagiaire.user', 'module'])
                ->whereNull('submission_id')
                ->where('status', Note::STATUS_SUBMITTED)
                ->orderBy('id')
                ->get();

            foreach ($brokenNotes as $note) {
                $result = $this->repairNote($note, $historyByNote->get($note->id, collect()));

                if ($result['repaired']) {
                    $report['repaired'][] = $result;
                } else {
                    $report['unrecoverable'][] = $result;
                }
            }

            $orphanSubmissions = NoteSubmission::query()
                ->with(['groupe', 'module'])
                ->where('status', NoteSubmission::STATUS_APPROVED)
                ->whereDoesntHave('notes')
                ->orderBy('id')
                ->get();

            foreach ($orphanSubmissions as $submission) {
                $submissionHistories = NoteHistory::query()
                    ->where('submission_id', $submission->id)
                    ->orderBy('id')
                    ->get()
                    ->groupBy('note_id');

                if ($submissionHistories->isEmpty()) {
                    $report['unrecoverable'][] = [
                        'submission_id' => $submission->id,
                        'repaired' => false,
                        'reason' => 'No history rows exist for this approved submission.',
                    ];
                    continue;
                }

                foreach ($submissionHistories as $noteId => $historyRows) {
                    $note = Note::query()->with(['stagiaire.user', 'module'])->find($noteId);
                    $result = $this->repairNote($note, $historyRows, $submission);

                    if ($result['repaired']) {
                        $report['repaired'][] = $result;
                    } else {
                        $report['unrecoverable'][] = $result;
                    }
                }
            }
        });

        $this->line('Repair report');
        $this->line('Repaired: ' . count($report['repaired']));
        $this->line('Unrecoverable: ' . count($report['unrecoverable']));

        if ($report['repaired'] !== []) {
            $this->line('');
            $this->line('Repaired rows:');
            foreach ($report['repaired'] as $item) {
                $this->line(json_encode($item, JSON_UNESCAPED_UNICODE));
            }
        }

        if ($report['unrecoverable'] !== []) {
            $this->line('');
            $this->line('Unrecoverable rows:');
            foreach ($report['unrecoverable'] as $item) {
                $this->line(json_encode($item, JSON_UNESCAPED_UNICODE));
            }
        }

        return self::SUCCESS;
    }

    /**
     * @param Collection<int, NoteHistory> $historyRows
     */
    private function repairNote(?Note $note, Collection $historyRows, ?NoteSubmission $forcedSubmission = null): array
    {
        $snapshot = null;
        $submissionId = null;

        if ($historyRows->isNotEmpty()) {
            $snapshot = $this->buildSnapshotFromHistory($historyRows, $note, $forcedSubmission);
            $submissionId = $snapshot['submission_id'] ?? null;
        } else {
            $submission = $forcedSubmission ?: $this->resolveSubmissionFromNote($note);

            if ($submission && $this->submissionSnapshotHasValues($submission)) {
                $snapshot = $this->buildSnapshotFromSubmission($submission, $note);
                $submissionId = $submission->id;
            }
        }

        if ($snapshot === null) {
            return [
                'repaired' => false,
                'note_id' => $note?->id,
                'submission_id' => $forcedSubmission?->id,
                'reason' => 'No recoverable history or snapshot exists for this note.',
            ];
        }

        if ($note === null && $historyRows->isNotEmpty()) {
            $note = new Note();
            $note->id = (int) $historyRows->first()->note_id;
        }

        if ($submissionId === null) {
            return [
                'repaired' => false,
                'note_id' => $note?->id,
                'submission_id' => null,
                'reason' => 'History exists but no submission_id could be resolved.',
            ];
        }

        $before = $note->exists ? $note->workflowSnapshot() : [];

        $submission = NoteSubmission::query()->with('notes')->find($submissionId);
        if (! $submission) {
            return [
                'repaired' => false,
                'note_id' => $note->id,
                'submission_id' => $submissionId,
                'reason' => 'Referenced submission does not exist.',
            ];
        }

        $this->gradeWorkflow->applySnapshot($note, $snapshot);
        $note->submission_id = $submission->id;
        $note->save();
        $note->refresh();

        $this->gradeWorkflow->snapshotSubmissionFromNote($submission, $note);
        $this->gradeWorkflow->recordHistory($note, 'repaired', $before, $note->workflowSnapshot(), null);

        return [
            'repaired' => true,
            'note_id' => $note->id,
            'submission_id' => $submission->id,
            'student_id' => $note->stagiaire_id,
            'module_id' => $note->module_id,
            'cc1' => $note->cc1,
            'cc2' => $note->cc2,
            'cc3' => $note->cc3,
            'efm' => $note->efm,
            'final_grade' => $note->note,
        ];
    }

    private function resolveSubmissionFromNote(?Note $note): ?NoteSubmission
    {
        if (! $note || ! $note->stagiaire_id || ! $note->module_id) {
            return null;
        }

        $stagiaire = Stagiaire::query()->find($note->stagiaire_id);
        if (! $stagiaire) {
            return null;
        }

        $submissions = NoteSubmission::query()
            ->where('groupe_id', $stagiaire->groupe_id)
            ->where('module_id', $note->module_id)
            ->get();

        return $submissions->count() === 1 ? $submissions->first() : null;
    }

    private function submissionSnapshotHasValues(NoteSubmission $submission): bool
    {
        return collect(['cc1', 'cc2', 'cc3', 'efm', 'final_grade'])
            ->every(fn (string $field) => $submission->{$field} !== null);
    }

    private function buildSnapshotFromSubmission(NoteSubmission $submission, ?Note $note): array
    {
        return Note::prepareWorkflowAttributes([
            'submission_id' => $submission->id,
            'stagiaire_id' => $note?->stagiaire_id,
            'module_id' => $note?->module_id,
            'cc1' => $submission->cc1,
            'cc2' => $submission->cc2,
            'cc3' => $submission->cc3,
            'efm' => $submission->efm,
            'note' => $submission->final_grade,
            'status' => $submission->status,
            'validation_status' => $submission->status,
        ]);
    }

    /**
     * @param Collection<int, NoteHistory> $historyRows
     */
    private function buildSnapshotFromHistory(Collection $historyRows, ?Note $note, ?NoteSubmission $forcedSubmission = null): array
    {
        $snapshot = [
            'submission_id' => $forcedSubmission?->id,
            'stagiaire_id' => $note?->stagiaire_id ?? $historyRows->last()?->stagiaire_id,
            'module_id' => $note?->module_id ?? $historyRows->last()?->module_id,
        ];

        foreach ($historyRows->groupBy('component') as $component => $entries) {
            $latest = $entries->last();
            $value = $this->gradeWorkflow->restoreScalarValue($latest->new_value);

            if ($component === 'final_grade') {
                $snapshot['note'] = $value;
            } else {
                $snapshot[$component] = $value;
            }

            if ($component === 'submission_id' && $value !== null) {
                $snapshot['submission_id'] = (int) $value;
            }
        }

        $submissionIdFromHistory = $historyRows->pluck('submission_id')->filter()->last();
        if ($submissionIdFromHistory !== null) {
            $snapshot['submission_id'] = (int) $submissionIdFromHistory;
        }

        if (! isset($snapshot['note']) && isset($snapshot['cc1'], $snapshot['cc2'], $snapshot['cc3'], $snapshot['efm'])) {
            $snapshot['note'] = $this->calculateAverage($snapshot);
        }

        $snapshot = Note::prepareWorkflowAttributes([
            'submission_id' => $snapshot['submission_id'] ?? null,
            'stagiaire_id' => $snapshot['stagiaire_id'] ?? null,
            'module_id' => $snapshot['module_id'] ?? null,
            'cc1' => $snapshot['cc1'] ?? null,
            'cc2' => $snapshot['cc2'] ?? null,
            'cc3' => $snapshot['cc3'] ?? null,
            'efm' => $snapshot['efm'] ?? null,
            'note' => $snapshot['note'] ?? null,
            'status' => $snapshot['status'] ?? null,
            'validation_status' => $snapshot['validation_status'] ?? null,
            'controle1_status' => $snapshot['controle1_status'] ?? null,
            'controle2_status' => $snapshot['controle2_status'] ?? null,
            'controle3_status' => $snapshot['controle3_status'] ?? null,
            'efm_status' => $snapshot['efm_status'] ?? null,
            'reviewed_at' => $snapshot['reviewed_at'] ?? null,
        ]);

        if (($snapshot['status'] ?? null) === Note::STATUS_APPROVED && ($snapshot['note'] ?? null) === null) {
            $snapshot['note'] = $this->calculateAverage($snapshot);
        }

        return $snapshot;
    }

    /**
     * @param array<string, mixed> $validated
     */
    private function calculateAverage(array $validated): ?float
    {
        foreach (['cc1', 'cc2', 'cc3', 'efm'] as $field) {
            if (! array_key_exists($field, $validated) || $validated[$field] === null) {
                return null;
            }
        }

        return round(((float) $validated['cc1'] + (float) $validated['cc2'] + (float) $validated['cc3'] + (float) $validated['efm']) / 5, 2);
    }
}
