<?php

namespace App\Http\Requests\Api\Professeur;

use Illuminate\Foundation\Http\FormRequest;

class StoreNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'professeur';
    }

    public function rules(): array
    {
        return [
            'stagiaire_id' => ['required', 'integer', 'exists:stagiaires,id'],
            'module_id' => ['required', 'integer', 'exists:modules,id'],
            'note' => ['required', 'numeric', 'min:0', 'max:20'],
        ];
    }
}
