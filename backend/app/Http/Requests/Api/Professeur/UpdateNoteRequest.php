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
            'note' => ['required', 'numeric', 'min:0', 'max:20'],
        ];
    }
}
