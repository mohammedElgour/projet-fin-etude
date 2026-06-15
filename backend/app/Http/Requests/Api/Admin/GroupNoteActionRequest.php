<?php

namespace App\Http\Requests\Api\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Log;

class GroupNoteActionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    protected function prepareForValidation(): void
    {
        $submissionId = $this->input('submission_id', $this->input('submissionId'));
        $groupeId = $this->input('groupe_id', $this->input('group_id', $this->input('groupId', $this->input('groupeId'))));
        $moduleId = $this->input('module_id', $this->input('moduleId'));

        $this->merge([
            'submission_id' => $submissionId,
            'groupe_id' => $groupeId,
            'module_id' => $moduleId,
        ]);

        if (app()->hasDebugModeEnabled()) {
            Log::debug('validate-group request normalized', [
                'payload' => $this->all(),
                'route' => $this->path(),
                'user_id' => $this->user()?->id,
            ]);
        }
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

    public function messages(): array
    {
        return [
            'submission_id.required_without_all' => 'Provide submission_id or both groupe_id and module_id.',
            'groupe_id.required_without' => 'groupe_id is required when submission_id is not provided.',
            'module_id.required_without' => 'module_id is required when submission_id is not provided.',
            'groupe_id.required_with' => 'module_id requires groupe_id.',
            'module_id.required_with' => 'groupe_id requires module_id.',
        ];
    }
}
