<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GroupeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'filiere_id' => $this->filiere_id,
            'filiere' => $this->whenLoaded('filier'),
            'students_count' => $this->whenCounted('stagiaires'),
            'stagiaires' => $this->whenLoaded('stagiaires'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
