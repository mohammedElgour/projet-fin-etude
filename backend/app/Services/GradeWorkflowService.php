<?php

namespace App\Services;

use App\Models\Note;
use App\Models\NoteHistory;
use App\Models\NoteSubmission;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class GradeWorkflowService
{
    public const SNAPSHOT_FIELDS = [
        'submission_id',
        'stagiaire_id',
        'module_id',
        'cc1',
        'cc2',
        'cc3',
        'efm',
        'note',
        'status',
        'validation_status',
        'controle1_status',
        'controle2_status',
        'controle3_status',
        'efm_status',
        'reviewed_at',
    ];

    public function assertSubmissionHasNotes(NoteSubmission $submission): void
    {
        $submission->loadMissing('notes');

        if ($submission->notes->isEmpty()) {
            throw new RuntimeException(sprintf('NoteSubmission %d has no related notes.', $submission->id));
        }
    }

    public function snapshotSubmissionFromNote(NoteSubmission $submission, Note $note): NoteSubmission
    {
        $submission->update($this->submissionSnapshotPayload($note));

        return $submission->fresh();
    }

    public function submissionSnapshotPayload(Note $note): array
    {
        return [
            'cc1' => $note->cc1,
            'cc2' => $note->cc2,
            'cc3' => $note->cc3,
            'efm' => $note->efm,
            'final_grade' => $note->note,
        ];
    }

    /**
     * @param array<string, mixed> $before
     * @param array<string, mixed> $after
     */
    public function recordHistory(Note $note, string $action, array $before, array $after, ?int $createdBy = null): void
    {
        $entries = [];

        foreach (self::SNAPSHOT_FIELDS as $field) {
            $oldValue = $before[$field] ?? null;
            $newValue = $after[$field] ?? null;

            if ($this->valuesMatch($oldValue, $newValue)) {
                continue;
            }

            $entries[] = [
                'note_id' => $note->id,
                'submission_id' => $after['submission_id'] ?? $before['submission_id'] ?? $note->submission_id,
                'stagiaire_id' => $after['stagiaire_id'] ?? $before['stagiaire_id'] ?? $note->stagiaire_id,
                'module_id' => $after['module_id'] ?? $before['module_id'] ?? $note->module_id,
                'component' => $field === 'note' ? 'final_grade' : $field,
                'old_value' => $this->stringifyValue($oldValue),
                'new_value' => $this->stringifyValue($newValue),
                'created_by' => $createdBy,
                'action' => $action,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if ($entries === []) {
            return;
        }

        NoteHistory::query()->insert($entries);

        foreach ($entries as $entry) {
            Log::info('Grade operation recorded', [
                'action' => $entry['action'],
                'component' => $entry['component'],
                'note_id' => $entry['note_id'],
                'submission_id' => $entry['submission_id'],
                'stagiaire_id' => $entry['stagiaire_id'],
                'module_id' => $entry['module_id'],
                'old_value' => $entry['old_value'],
                'new_value' => $entry['new_value'],
                'created_by' => $entry['created_by'],
            ]);
        }
    }

    public function logAction(string $message, array $context): void
    {
        Log::info($message, $context);
    }

    public function restoreScalarValue(?string $value): mixed
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_numeric($value)) {
            return str_contains($value, '.') ? (float) $value : (int) $value;
        }

        return $value;
    }

    /**
     * @param array<string, mixed> $snapshot
     */
    public function applySnapshot(Note $note, array $snapshot, bool $preserveSubmissionId = false): void
    {
        $payload = [
            'submission_id' => $preserveSubmissionId ? $note->submission_id : ($snapshot['submission_id'] ?? $note->submission_id),
            'stagiaire_id' => $snapshot['stagiaire_id'] ?? $note->stagiaire_id,
            'module_id' => $snapshot['module_id'] ?? $note->module_id,
            'cc1' => $snapshot['cc1'] ?? null,
            'cc2' => $snapshot['cc2'] ?? null,
            'cc3' => $snapshot['cc3'] ?? null,
            'efm' => $snapshot['efm'] ?? null,
            'note' => $snapshot['final_grade'] ?? ($snapshot['note'] ?? null),
            'status' => $snapshot['status'] ?? $note->workflowStatus(),
            'validation_status' => $snapshot['validation_status'] ?? $note->workflowStatus(),
            'controle1_status' => $snapshot['controle1_status'] ?? $note->controle1_status ?? Note::STATUS_DRAFT,
            'controle2_status' => $snapshot['controle2_status'] ?? $note->controle2_status ?? Note::STATUS_DRAFT,
            'controle3_status' => $snapshot['controle3_status'] ?? $note->controle3_status ?? Note::STATUS_DRAFT,
            'efm_status' => $snapshot['efm_status'] ?? $note->efm_status ?? Note::STATUS_DRAFT,
            'reviewed_at' => $snapshot['reviewed_at'] ?? $note->reviewed_at,
        ];

        $note->fill($payload);
    }

    private function valuesMatch(mixed $oldValue, mixed $newValue): bool
    {
        return $this->stringifyValue($oldValue) === $this->stringifyValue($newValue);
    }

    private function stringifyValue(mixed $value): ?string
    {
        if ($value instanceof Carbon) {
            return $value->toISOString();
        }

        if ($value === null) {
            return null;
        }

        if (is_bool($value)) {
            return $value ? '1' : '0';
        }

        return (string) $value;
    }
}
