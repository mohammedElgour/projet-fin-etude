<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Schema;

class Note extends Model
{
    use HasFactory;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_SUBMITTED = 'submitted';
    public const STATUS_VALIDATED = 'validated';
    public const STATUS_REJECTED = 'rejected';

    protected static ?bool $hasStatusColumn = null;

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

    public static function normalizeWorkflowStatus(?string $status): string
    {
        return match ($status) {
            self::STATUS_VALIDATED => self::STATUS_VALIDATED,
            self::STATUS_REJECTED => self::STATUS_REJECTED,
            'pending', self::STATUS_SUBMITTED => self::STATUS_SUBMITTED,
            self::STATUS_DRAFT => self::STATUS_DRAFT,
            default => self::STATUS_DRAFT,
        };
    }

    public static function prepareWorkflowAttributes(array $attributes): array
    {
        $status = static::normalizeWorkflowStatus($attributes['status'] ?? $attributes['validation_status'] ?? null);

        $attributes['validation_status'] = $status === static::STATUS_SUBMITTED
            ? 'pending'
            : $status;
        $attributes['is_validated'] = $status === static::STATUS_VALIDATED;

        if (static::hasStatusColumn()) {
            $attributes['status'] = $status;
        } else {
            unset($attributes['status']);
        }

        return $attributes;
    }

    public static function applyWorkflowStatusFilter(Builder $query, string|array $statuses): Builder
    {
        $normalizedStatuses = collect(is_array($statuses) ? $statuses : [$statuses])
            ->map(fn ($status) => static::normalizeWorkflowStatus((string) $status))
            ->unique()
            ->values();

        if (static::hasStatusColumn()) {
            return $normalizedStatuses->count() === 1
                ? $query->where('status', $normalizedStatuses->first())
                : $query->whereIn('status', $normalizedStatuses->all());
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
        return static::normalizeWorkflowStatus($this->attributes['status'] ?? $this->attributes['validation_status'] ?? null);
    }

    public function synchronizeWorkflowFields(): void
    {
        $status = static::normalizeWorkflowStatus($this->attributes['status'] ?? $this->attributes['validation_status'] ?? null);

        if (static::hasStatusColumn()) {
            $this->attributes['status'] = $status;
        } else {
            unset($this->attributes['status']);
        }

        $this->attributes['validation_status'] = $status === self::STATUS_SUBMITTED ? 'pending' : $status;
        $this->attributes['is_validated'] = $status === self::STATUS_VALIDATED;
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

    /**
     * Get the module that the note belongs to.
     */
    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }
}
