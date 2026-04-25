<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmploiDuTemps extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'groupe_id',
        'fichier',
        'date',
    ];
    protected $table = 'emplois_du_temps';

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'fichier' => 'json',
        'date' => 'date',
    ];

    /**
     * Get the groupe that owns the emploi du temps.
     */
    public function groupe(): BelongsTo
    {
        return $this->belongsTo(Groupe::class);
    }
}

