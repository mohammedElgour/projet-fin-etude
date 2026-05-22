<?php

namespace App\Http\Requests\Api\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateManagedNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'cc1' => ['nullable', 'numeric', 'min:0', 'max:20'],
            'cc2' => ['nullable', 'numeric', 'min:0', 'max:20'],
            'cc3' => ['nullable', 'numeric', 'min:0', 'max:20'],
            'efm' => ['nullable', 'numeric', 'min:0', 'max:20'],
            'status' => ['sometimes', 'required', Rule::in(['draft', 'submitted', 'validated', 'rejected'])],
            'feedback' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
