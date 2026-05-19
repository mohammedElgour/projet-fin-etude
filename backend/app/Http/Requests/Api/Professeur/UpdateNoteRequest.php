<?php

namespace App\Http\Requests\Api\Professeur;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'professeur';
    }

    public function rules(): array
    {
        return [
            'cc1' => ['nullable', 'numeric', 'min:0', 'max:20'],
            'cc2' => ['nullable', 'numeric', 'min:0', 'max:20'],
            'cc3' => ['nullable', 'numeric', 'min:0', 'max:20'],
            'efm' => ['nullable', 'numeric', 'min:0', 'max:20'],
        ];
    }
}
