<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NoteHistory extends Model
{
    use HasFactory;

    protected $table = 'note_history';

    protected $fillable = [
        'id',
        'note_id',
        'submission_id',
        'stagiaire_id',
        'module_id',
        'component',
        'old_value',
        'new_value',
        'created_by',
        'action',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function note(): BelongsTo
    {
        return $this->belongsTo(Note::class);
    }

    public function submission(): BelongsTo
    {
        return $this->belongsTo(NoteSubmission::class, 'submission_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
