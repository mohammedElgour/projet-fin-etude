<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Note extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'stagiaire_id',
        'module_id',
        'note',
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
        'note' => 'decimal:2',
        'is_validated' => 'boolean',
        'reviewed_at' => 'datetime',
    ];

    /**
     * Get the stagiaire that owns the note.
     */
    public function stagiaire(): BelongsTo
    {
        return $this->belongsTo(Stagiaire::class);
    }

    /**
     * Get the module that the note belongs to.
     */
    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }
}
