<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Module extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'code',
        'nom',
        'coefficient',
        'filiere_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'coefficient' => 'decimal:2',
    ];

    /**
     * Get the filier that owns the module.
     */
    public function filier(): BelongsTo
    {
        return $this->belongsTo(Filier::class, 'filiere_id');
    }

    /**
     * Alias aligned with the database column naming.
     */
    public function filiere(): BelongsTo
    {
        return $this->filier();
    }

    /**
     * Get the notes for the module.
     */
    public function notes(): HasMany
    {
        return $this->hasMany(Note::class);
    }

    protected $table = 'modules';
}
