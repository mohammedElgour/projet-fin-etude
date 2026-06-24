<?php

namespace App\Http\Requests\Api\Professeur;

class SubmitNotesRequest extends SaveBatchNotesRequest
{
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'evaluation_type' => ['nullable', 'string', 'in:controle_1,controle_2,controle_3,efm'],
        ]);
    }
}
