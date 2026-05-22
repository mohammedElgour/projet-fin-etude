<?php

namespace App\Http\Requests\Api\Admin;

use Illuminate\Foundation\Http\FormRequest;

class GroupNoteActionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'submission_id' => ['nullable', 'integer', 'exists:note_submissions,id', 'required_without_all:groupe_id,module_id'],
            'groupe_id' => ['nullable', 'integer', 'exists:groupes,id', 'required_without:submission_id', 'required_with:module_id'],
            'module_id' => ['nullable', 'integer', 'exists:modules,id', 'required_without:submission_id', 'required_with:groupe_id'],
            'feedback' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
