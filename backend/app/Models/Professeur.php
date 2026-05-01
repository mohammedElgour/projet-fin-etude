<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
    ];

    /**
     * Get the user that owns the professeur.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function emploisDuTemps(): HasMany
    {
        return $this->hasMany(EmploiDuTemps::class);
    }

    public function notes(): HasMany
    {
        return $this->hasMany(Note::class);
    }

    /**
     * Modules assigned to this professeur via emplois du temps.
     */
    public function modules(): BelongsToMany
    {
        return $this->belongsToMany(\App\Models\Module::class, 'emplois_du_temps', 'professeur_id', 'module_id')
                    ->withPivot('groupe_id', 'start_time', 'end_time', 'day_of_week', 'date')
                    ->withTimestamps();
    }

    /**
     * Groupes assigned to this professeur via emplois du temps.
     */
    public function groupes(): BelongsToMany
    {
        return $this->belongsToMany(\App\Models\Groupe::class, 'emplois_du_temps', 'professeur_id', 'groupe_id')
                    ->withPivot('module_id', 'start_time', 'end_time', 'day_of_week', 'date')
                    ->withTimestamps();
    }
}
