<?php

namespace App\Http\Resources\Professeur;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfessorStudentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'groupe_id' => $this->groupe_id,
            'user' => [
                'id' => $this->user?->id,
                'name' => $this->user?->name,
                'email' => $this->user?->email,
            ],
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
            'notes' => ProfessorNoteResource::collection($this->whenLoaded('notes')),
        ];
    }
}
