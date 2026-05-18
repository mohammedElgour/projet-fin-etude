<?php

namespace App\Http\Resources\Professeur;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfessorScheduleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'date' => optional($this->date)?->toDateString(),
            'fichier' => collect($this->fichier ?? [])
                ->map(fn (array $slot) => [
                    'jour' => $slot['jour'] ?? null,
                    'heure' => $slot['heure'] ?? null,
                    'module' => $slot['module'] ?? null,
                ])
                ->values(),
            'groupe' => $this->whenLoaded('groupe', function () {
                return [
                    'id' => $this->groupe?->id,
                    'nom' => $this->groupe?->nom,
                    'filiere' => $this->groupe?->filiere ? [
                        'id' => $this->groupe->filiere->id,
                        'nom' => $this->groupe->filiere->nom,
                    ] : null,
                ];
            }),
        ];
    }
}
