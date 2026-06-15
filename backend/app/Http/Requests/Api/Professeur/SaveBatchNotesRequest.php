<?php

namespace App\Http\Requests\Api\Professeur;

use Illuminate\Foundation\Http\FormRequest;

class SaveBatchNotesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'professeur';
    }

    public function rules(): array
    {
        return [
            'groupe_id' => ['required', 'integer', 'exists:groupes,id'],
            'module_id' => ['required', 'integer', 'exists:modules,id'],
            'evaluation_type' => ['nullable', 'string', 'in:controle_1,controle_2,controle_3,efm'],
            'notes' => ['required', 'array', 'min:1'],
            'notes.*.stagiaire_id' => ['required', 'integer', 'distinct', 'exists:stagiaires,id'],
            'notes.*.controle_1' => ['nullable', 'numeric', 'min:0', 'max:20'],
            'notes.*.controle_2' => ['nullable', 'numeric', 'min:0', 'max:20'],
            'notes.*.controle_3' => ['nullable', 'numeric', 'min:0', 'max:20'],
            'notes.*.efm' => ['nullable', 'numeric', 'min:0', 'max:40'],
        ];
    }
}
