<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Groupe extends Model
{
    protected $table = 'groupes';

    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'nom',
        'filiere_id',
    ];

    /**
     * Get the filier that owns the groupe.
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
     * Get the stagiaires for the groupe.
     */
    public function stagiaires(): HasMany
    {
        return $this->hasMany(Stagiaire::class);
    }

    /**
     * Get the emplois du temps for the groupe.
     */
    public function emploisDuTemps(): HasMany
    {
        return $this->hasMany(EmploiDuTemps::class);
    }

    public function timetables(): HasMany
    {
        return $this->hasMany(Timetable::class);
    }
}
