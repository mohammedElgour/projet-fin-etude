<?php

namespace App\Http\Requests\Api\Common;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class StoreNotificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    protected function prepareForValidation(): void
    {
        if (!$this->filled('target_type') && $this->filled('recipient_type')) {
            $this->merge([
                'target_type' => $this->input('recipient_type'),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'target_type' => ['required', Rule::in(['stagiaires', 'professeurs', 'groupes', 'user_type'])],
            'stagiaire_ids' => ['required_if:target_type,stagiaires', 'array', 'min:1'],
            'stagiaire_ids.*' => ['integer', 'distinct', 'exists:stagiaires,id'],
            'professeur_ids' => ['required_if:target_type,professeurs', 'array', 'min:1'],
            'professeur_ids.*' => ['integer', 'distinct', 'exists:professeurs,id'],
            'groupe_ids' => ['required_if:target_type,groupes', 'array', 'min:1'],
            'groupe_ids.*' => ['integer', 'distinct', 'exists:groupes,id'],
            'user_type' => ['required_if:target_type,user_type', Rule::in(['stagiaire', 'professeur'])],
            'title' => ['nullable', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:2000'],
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $validator->errors(),
        ], 422));
    }

    protected function failedAuthorization(): void
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Unauthorized',
        ], 403));
    }
}
