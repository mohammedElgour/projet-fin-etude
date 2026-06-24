<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Schema;

class Note extends Model
{
    use HasFactory;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_SUBMITTED = 'submitted';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_VALIDATED = self::STATUS_APPROVED;
    public const STATUS_REJECTED = 'rejected';

    public const COMPONENT_FIELDS = ['cc1', 'cc2', 'cc3', 'efm'];

    public const COMPONENT_STATUS_FIELDS = [
        'cc1' => 'controle1_status',
        'cc2' => 'controle2_status',
        'cc3' => 'controle3_status',
        'efm' => 'efm_status',
    ];

    protected static ?bool $hasStatusColumn = null;
    protected static ?bool $hasComponentStatusColumns = null;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'submission_id',
        'stagiaire_id',
        'module_id',
        'cc1',
        'cc2',
        'cc3',
        'efm',
        'controle1_status',
        'controle2_status',
        'controle3_status',
        'efm_status',
        'note',
        'status',
        'is_validated',
        'validation_status',
        'feedback',
        'reviewed_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'cc1' => 'decimal:2',
        'cc2' => 'decimal:2',
        'cc3' => 'decimal:2',
        'efm' => 'decimal:2',
        'note' => 'decimal:2',
        'is_validated' => 'boolean',
        'reviewed_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::saving(function (self $note) {
            $note->synchronizeWorkflowFields();
        });
    }

    public static function hasStatusColumn(): bool
    {
        if (static::$hasStatusColumn !== null) {
            return static::$hasStatusColumn;
        }

        static::$hasStatusColumn = Schema::hasColumn((new static())->getTable(), 'status');

        return static::$hasStatusColumn;
    }

    public static function hasComponentStatusColumns(): bool
    {
        if (static::$hasComponentStatusColumns !== null) {
            return static::$hasComponentStatusColumns;
        }

        $table = (new static())->getTable();
        static::$hasComponentStatusColumns = collect(static::COMPONENT_STATUS_FIELDS)
            ->every(fn (string $column) => Schema::hasColumn($table, $column));

        return static::$hasComponentStatusColumns;
    }

    public static function normalizeWorkflowStatus(?string $status): string
    {
        return match ($status) {
            self::STATUS_APPROVED, 'validated' => self::STATUS_APPROVED,
            self::STATUS_REJECTED => self::STATUS_REJECTED,
            'pending', self::STATUS_SUBMITTED => self::STATUS_SUBMITTED,
            self::STATUS_DRAFT => self::STATUS_DRAFT,
            default => self::STATUS_DRAFT,
        };
    }

    public static function persistWorkflowStatus(string $status): string
    {
        return $status === self::STATUS_APPROVED ? 'validated' : $status;
    }

    public static function prepareWorkflowAttributes(array $attributes): array
    {
        $status = static::normalizeWorkflowStatus($attributes['status'] ?? $attributes['validation_status'] ?? null);
        $hasComponentStatusColumns = static::hasComponentStatusColumns();
        $hasExplicitComponentStatuses = $hasComponentStatusColumns && collect(static::COMPONENT_STATUS_FIELDS)
            ->contains(fn (string $statusField) => array_key_exists($statusField, $attributes) && $attributes[$statusField] !== null);

        if ($hasComponentStatusColumns) {
            foreach (static::COMPONENT_STATUS_FIELDS as $gradeField => $statusField) {
                if ($hasExplicitComponentStatuses && array_key_exists($statusField, $attributes) && $attributes[$statusField] !== null) {
                    $attributes[$statusField] = static::normalizeWorkflowStatus($attributes[$statusField]);
                    continue;
                }

                if (!$hasExplicitComponentStatuses) {
                    $attributes[$statusField] = $status;
                }
            }
        } else {
            foreach (static::COMPONENT_STATUS_FIELDS as $statusField) {
                unset($attributes[$statusField]);
            }
        }

        $derivedStatus = static::deriveWorkflowStatus($attributes);

        if (static::hasStatusColumn()) {
            $attributes['status'] = static::persistWorkflowStatus($derivedStatus);
        } else {
            unset($attributes['status']);
        }

        $attributes['validation_status'] = $derivedStatus;
        $attributes['is_validated'] = $derivedStatus === static::STATUS_APPROVED;

        return $attributes;
    }

    public static function applyWorkflowStatusFilter(Builder $query, string|array $statuses): Builder
    {
        $normalizedStatuses = collect(is_array($statuses) ? $statuses : [$statuses])
            ->map(fn ($status) => static::normalizeWorkflowStatus((string) $status))
            ->unique()
            ->values();

        if (static::hasStatusColumn()) {
            $persistedStatuses = $normalizedStatuses
                ->map(fn (string $status) => static::persistWorkflowStatus($status))
                ->unique()
                ->values();

            return $persistedStatuses->count() === 1
                ? $query->where('status', $persistedStatuses->first())
                : $query->whereIn('status', $persistedStatuses->all());
        }

        $legacyStatuses = $normalizedStatuses
            ->flatMap(fn (string $status) => $status === static::STATUS_SUBMITTED ? ['pending', static::STATUS_SUBMITTED] : [$status])
            ->unique()
            ->values();

        return $legacyStatuses->count() === 1
            ? $query->where('validation_status', $legacyStatuses->first())
            : $query->whereIn('validation_status', $legacyStatuses->all());
    }

    public function workflowStatus(): string
    {
        return static::deriveWorkflowStatus($this->attributes);
    }

    public function synchronizeWorkflowFields(): void
    {
        $status = static::normalizeWorkflowStatus($this->attributes['status'] ?? $this->attributes['validation_status'] ?? null);
        $hasComponentStatusColumns = static::hasComponentStatusColumns();
        $hasAnyComponentStatus = $hasComponentStatusColumns && collect(static::COMPONENT_STATUS_FIELDS)
            ->contains(fn (string $statusField) => array_key_exists($statusField, $this->attributes) && $this->attributes[$statusField] !== null);

        if (!$hasComponentStatusColumns) {
            foreach (static::COMPONENT_STATUS_FIELDS as $statusField) {
                unset($this->attributes[$statusField]);
            }
        } else {
            if (!$hasAnyComponentStatus) {
                foreach (static::COMPONENT_STATUS_FIELDS as $statusField) {
                    $this->attributes[$statusField] = $status;
                }
            } else {
                foreach (static::COMPONENT_STATUS_FIELDS as $statusField) {
                    if (array_key_exists($statusField, $this->attributes) && $this->attributes[$statusField] !== null) {
                        $this->attributes[$statusField] = static::normalizeWorkflowStatus($this->attributes[$statusField]);
                    }
                }
            }
        }

        $derivedStatus = static::deriveWorkflowStatus($this->attributes);

        if (static::hasStatusColumn()) {
            $this->attributes['status'] = static::persistWorkflowStatus($derivedStatus);
        } else {
            unset($this->attributes['status']);
        }

        $this->attributes['validation_status'] = $derivedStatus;
        $this->attributes['is_validated'] = $derivedStatus === static::STATUS_APPROVED;
    }

    public function componentStatus(string $gradeField): string
    {
        $statusField = static::COMPONENT_STATUS_FIELDS[$gradeField] ?? null;

        if (!$statusField) {
            return static::STATUS_DRAFT;
        }

        return static::normalizeWorkflowStatus($this->attributes[$statusField] ?? null);
    }

    public function componentApproved(string $gradeField): bool
    {
        return $this->componentStatus($gradeField) === static::STATUS_APPROVED;
    }

    public function hasAnySubmittedComponent(): bool
    {
        return collect(static::COMPONENT_STATUS_FIELDS)
            ->contains(fn (string $statusField) => static::normalizeWorkflowStatus($this->attributes[$statusField] ?? null) === static::STATUS_SUBMITTED);
    }

    public function hasAnyRejectedComponent(): bool
    {
        return collect(static::COMPONENT_STATUS_FIELDS)
            ->contains(fn (string $statusField) => static::normalizeWorkflowStatus($this->attributes[$statusField] ?? null) === static::STATUS_REJECTED);
    }

    public function hasAnyApprovedComponent(): bool
    {
        return collect(static::COMPONENT_STATUS_FIELDS)
            ->contains(fn (string $statusField) => static::normalizeWorkflowStatus($this->attributes[$statusField] ?? null) === static::STATUS_APPROVED);
    }

    public function hasAllApprovedComponents(): bool
    {
        return collect(static::COMPONENT_STATUS_FIELDS)
            ->every(fn (string $statusField) => static::normalizeWorkflowStatus($this->attributes[$statusField] ?? null) === static::STATUS_APPROVED)
            && collect(static::COMPONENT_FIELDS)
                ->every(fn (string $field) => $this->attributes[$field] !== null);
    }

    public function finalAverage(): ?float
    {
        if ($this->workflowStatus() !== static::STATUS_APPROVED) {
            return null;
        }

        return $this->note !== null ? (float) $this->note : null;
    }

    public static function deriveWorkflowStatus(array $attributes): string
    {
        $componentStatuses = collect(static::COMPONENT_STATUS_FIELDS)
            ->mapWithKeys(function (string $statusField, string $gradeField) use ($attributes) {
                return [$gradeField => static::normalizeWorkflowStatus($attributes[$statusField] ?? null)];
            });

        $fallbackStatus = static::normalizeWorkflowStatus($attributes['status'] ?? $attributes['validation_status'] ?? null);

        if (
            $componentStatuses->every(fn (string $componentStatus) => $componentStatus === static::STATUS_APPROVED)
            && collect(static::COMPONENT_FIELDS)->every(fn (string $field) => array_key_exists($field, $attributes) ? $attributes[$field] !== null : true)
        ) {
            return static::STATUS_APPROVED;
        }

        if ($componentStatuses->contains(static::STATUS_REJECTED)) {
            return static::STATUS_REJECTED;
        }

        if ($componentStatuses->contains(static::STATUS_SUBMITTED) || $componentStatuses->contains(static::STATUS_APPROVED)) {
            return static::STATUS_SUBMITTED;
        }

        return $fallbackStatus;
    }

    /**
     * Get the stagiaire that owns the note.
     */
    public function stagiaire(): BelongsTo
    {
        return $this->belongsTo(Stagiaire::class);
    }

    public function submission(): BelongsTo
    {
        return $this->belongsTo(NoteSubmission::class, 'submission_id');
    }

    public function history(): HasMany
    {
        return $this->hasMany(NoteHistory::class);
    }

    /**
     * Get the module that the note belongs to.
     */
    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    /**
     * Return the workflow fields that should be audited or restored.
     *
     * @return array<string, mixed>
     */
    public function workflowSnapshot(): array
    {
        return [
            'submission_id' => $this->submission_id,
            'stagiaire_id' => $this->stagiaire_id,
            'module_id' => $this->module_id,
            'cc1' => $this->cc1,
            'cc2' => $this->cc2,
            'cc3' => $this->cc3,
            'efm' => $this->efm,
            'note' => $this->note,
            'status' => $this->status,
            'validation_status' => $this->validation_status,
            'controle1_status' => $this->controle1_status,
            'controle2_status' => $this->controle2_status,
            'controle3_status' => $this->controle3_status,
            'efm_status' => $this->efm_status,
            'reviewed_at' => optional($this->reviewed_at)?->toISOString(),
        ];
    }
}
