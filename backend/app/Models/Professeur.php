<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Filier;

class Professeur extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'specialite',
        'filiere_id',
    ];

    /**
     * Get the user that owns the professeur.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function filier(): BelongsTo
    {
        return $this->belongsTo(Filier::class, 'filiere_id');
    }

    public function filiere(): BelongsTo
    {
        return $this->filier();
    }
}
