<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Module;
use App\Models\Groupe;

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
    ];

    protected $appends = [
        'filieres',
    ];

    /**
     * Get the user that owns the professeur.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function timetables(): BelongsToMany
    {
        return $this->belongsToMany(Timetable::class, 'timetable_professeur')
            ->withTimestamps();
    }

    public function modules()
    {
        return $this->belongsToMany(Module::class, 'professeur_module')
            ->withTimestamps();
    }

    public function groupes()
    {
        return $this->belongsToMany(Groupe::class, 'professeur_groupe')
            ->withTimestamps();
    }

    public function noteSubmissions(): HasMany
    {
        return $this->hasMany(NoteSubmission::class, 'teacher_id');
    }

    /**
     * Derive the filieres taught by the professor from the assigned groups.
     *
     * @return array<int, array{id:int, nom:string}>
     */
    public function getFilieresAttribute(): array
    {
        $groupes = $this->relationLoaded('groupes')
            ? $this->groupes
            : $this->groupes()->with('filiere')->get();

        return $groupes
            ->pluck('filiere')
            ->filter()
            ->unique('id')
            ->values()
            ->map(fn ($filiere) => [
                'id' => $filiere->id,
                'nom' => $filiere->nom,
            ])
            ->all();
    }
}
