<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NoteSubmission extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';

    public const EVALUATION_CONTROLE_1 = 'controle_1';
    public const EVALUATION_CONTROLE_2 = 'controle_2';
    public const EVALUATION_CONTROLE_3 = 'controle_3';
    public const EVALUATION_EFM = 'efm';

    protected $fillable = [
        'groupe_id',
        'module_id',
        'evaluation_type',
        'teacher_id',
        'status',
        'submitted_at',
        'approved_at',
        'rejected_at',
        'admin_comment',
        'cc1',
        'cc2',
        'cc3',
        'efm',
        'final_grade',
    ];

    protected $casts = [
        'cc1' => 'decimal:2',
        'cc2' => 'decimal:2',
        'cc3' => 'decimal:2',
        'efm' => 'decimal:2',
        'final_grade' => 'decimal:2',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    public function groupe(): BelongsTo
    {
        return $this->belongsTo(Groupe::class);
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Professeur::class, 'teacher_id');
    }

    public function evaluationType(): string
    {
        $evaluationType = strtolower(trim((string) ($this->evaluation_type ?? '')));

        return in_array($evaluationType, [
            self::EVALUATION_CONTROLE_1,
            self::EVALUATION_CONTROLE_2,
            self::EVALUATION_CONTROLE_3,
            self::EVALUATION_EFM,
        ], true)
            ? $evaluationType
            : 'legacy';
    }

    public function evaluationLabel(): string
    {
        return match ($this->evaluationType()) {
            self::EVALUATION_CONTROLE_1 => 'Contrôle 1',
            self::EVALUATION_CONTROLE_2 => 'Contrôle 2',
            self::EVALUATION_CONTROLE_3 => 'Contrôle 3',
            self::EVALUATION_EFM => 'EFM',
            default => 'Evaluation',
        };
    }

    public function evaluationGradeField(): ?string
    {
        return match ($this->evaluationType()) {
            self::EVALUATION_CONTROLE_1 => 'cc1',
            self::EVALUATION_CONTROLE_2 => 'cc2',
            self::EVALUATION_CONTROLE_3 => 'cc3',
            self::EVALUATION_EFM => 'efm',
            default => null,
        };
    }

    public function evaluationStatusField(): ?string
    {
        return $this->evaluationGradeField()
            ? Note::COMPONENT_STATUS_FIELDS[$this->evaluationGradeField()] ?? null
            : null;
    }

    public function notes(): HasMany
    {
        return $this->hasMany(Note::class, 'submission_id');
    }

    public function history(): HasMany
    {
        return $this->hasMany(NoteHistory::class, 'submission_id');
    }

    public function workflowStatus(): string
    {
        return $this->submitted_at
            ? Note::normalizeWorkflowStatus($this->status)
            : Note::STATUS_DRAFT;
    }

    public function assertHasNotes(): void
    {
        $this->loadMissing('notes');

        if ($this->notes->isEmpty()) {
            throw new \RuntimeException(sprintf('NoteSubmission %d has no related notes.', $this->id));
        }
    }

    public function syncSnapshotFromNote(Note $note): void
    {
        $this->fill([
            'cc1' => $note->cc1,
            'cc2' => $note->cc2,
            'cc3' => $note->cc3,
            'efm' => $note->efm,
            'final_grade' => $note->note,
        ]);
    }

    /**
     * @return array{status:string,submitted_at:?string,approved_at:?string,rejected_at:?string}
     */
    public function deriveWorkflowState(): array
    {
        $notes = $this->relationLoaded('notes') ? $this->notes : $this->notes()->get();

        if ($notes->isEmpty()) {
            return [
                'status' => Note::STATUS_DRAFT,
                'submitted_at' => null,
                'approved_at' => null,
                'rejected_at' => null,
            ];
        }

        $evaluationStatusField = $this->evaluationStatusField();

        if ($evaluationStatusField) {
            $allApproved = $notes->every(fn (Note $note) => Note::normalizeWorkflowStatus($note->{$evaluationStatusField} ?? null) === Note::STATUS_APPROVED);
            $anyRejected = $notes->contains(fn (Note $note) => Note::normalizeWorkflowStatus($note->{$evaluationStatusField} ?? null) === Note::STATUS_REJECTED);
            $anySubmitted = $notes->contains(fn (Note $note) => in_array(Note::normalizeWorkflowStatus($note->{$evaluationStatusField} ?? null), [Note::STATUS_SUBMITTED, Note::STATUS_APPROVED, Note::STATUS_REJECTED], true));
        } else {
            $allApproved = $notes->every(fn (Note $note) => $note->workflowStatus() === Note::STATUS_APPROVED);
            $anyRejected = $notes->contains(fn (Note $note) => $note->workflowStatus() === Note::STATUS_REJECTED);
            $anySubmitted = $notes->contains(fn (Note $note) => in_array($note->workflowStatus(), [Note::STATUS_SUBMITTED, Note::STATUS_APPROVED, Note::STATUS_REJECTED], true));
        }

        if ($allApproved) {
            return [
                'status' => Note::STATUS_APPROVED,
                'submitted_at' => $this->submitted_at ?: now()->toISOString(),
                'approved_at' => $this->approved_at ?: now()->toISOString(),
                'rejected_at' => null,
            ];
        }

        if ($anyRejected) {
            return [
                'status' => Note::STATUS_REJECTED,
                'submitted_at' => $this->submitted_at ?: now()->toISOString(),
                'approved_at' => null,
                'rejected_at' => now()->toISOString(),
            ];
        }

        if ($anySubmitted) {
            return [
                'status' => Note::STATUS_SUBMITTED,
                'submitted_at' => $this->submitted_at ?: now()->toISOString(),
                'approved_at' => null,
                'rejected_at' => null,
            ];
        }

        return [
            'status' => Note::STATUS_DRAFT,
            'submitted_at' => null,
            'approved_at' => null,
            'rejected_at' => null,
        ];
    }
}
