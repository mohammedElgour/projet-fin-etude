<?php

namespace App\Http\Resources\Professeur;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfessorNoteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'stagiaire_id' => $this->stagiaire_id,
            'module_id' => $this->module_id,
            'note' => $this->note !== null ? (float) $this->note : null,
            'validation_status' => $this->validation_status,
            'is_validated' => (bool) $this->is_validated,
            'feedback' => $this->feedback,
            'reviewed_at' => optional($this->reviewed_at)?->toISOString(),
            'updated_at' => optional($this->updated_at)?->toISOString(),
            'stagiaire' => $this->whenLoaded('stagiaire', function () {
                return [
                    'id' => $this->stagiaire?->id,
                    'groupe_id' => $this->stagiaire?->groupe_id,
                    'user' => [
                        'id' => $this->stagiaire?->user?->id,
                        'name' => $this->stagiaire?->user?->name,
                        'email' => $this->stagiaire?->user?->email,
                    ],
                ];
            }),
            'module' => $this->whenLoaded('module', function () {
                return [
                    'id' => $this->module?->id,
                    'nom' => $this->module?->nom,
                    'code' => $this->module?->code,
                ];
            }),
        ];
    }
}
