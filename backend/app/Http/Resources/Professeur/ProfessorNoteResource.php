<?php

namespace App\Http\Resources\Professeur;

use App\Models\Note;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfessorNoteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $status = $this->resource instanceof Note
            ? $this->resource->workflowStatus()
            : Note::normalizeWorkflowStatus($this->status ?: $this->validation_status ?: null);

        return [
            'id' => $this->id,
            'submission_id' => $this->submission_id,
            'stagiaire_id' => $this->stagiaire_id,
            'module_id' => $this->module_id,
            'cc1' => $this->cc1 !== null ? (float) $this->cc1 : null,
            'cc2' => $this->cc2 !== null ? (float) $this->cc2 : null,
            'cc3' => $this->cc3 !== null ? (float) $this->cc3 : null,
            'efm' => $this->efm !== null ? (float) $this->efm : null,
            'note' => $this->note !== null ? (float) $this->note : null,
            'moyenne' => $this->note !== null ? (float) $this->note : null,
            'status' => $status,
            'validation_status' => $this->validation_status ?: $status,
            'is_validated' => $status === 'validated',
            'feedback' => $this->feedback,
            'reviewed_at' => optional($this->reviewed_at)?->toISOString(),
            'updated_at' => optional($this->updated_at)?->toISOString(),
            'stagiaire' => $this->whenLoaded('stagiaire', function () {
                return [
                    'id' => $this->stagiaire?->id,
                    'groupe_id' => $this->stagiaire?->groupe_id,
                    'groupe' => $this->stagiaire?->groupe ? [
                        'id' => $this->stagiaire->groupe->id,
                        'nom' => $this->stagiaire->groupe->nom,
                    ] : null,
                    'user' => [
                        'id' => $this->stagiaire?->user?->id,
                        'name' => $this->stagiaire?->user?->name,
                        'email' => $this->stagiaire?->user?->email,
                    ],
                ];
            }),
            'module' => $this->whenLoaded('module', function () {
                return [
                    'id' => $this->module?->id,
                    'nom' => $this->module?->nom,
                    'code' => $this->module?->code,
                ];
            }),
            'submission' => $this->whenLoaded('submission', function () {
                $submissionStatus = $this->submission?->submitted_at
                    ? $this->submission?->status
                    : Note::STATUS_DRAFT;

                return [
                    'id' => $this->submission?->id,
                    'status' => $submissionStatus,
                    'submitted_at' => optional($this->submission?->submitted_at)?->toISOString(),
                    'approved_at' => optional($this->submission?->approved_at)?->toISOString(),
                    'rejected_at' => optional($this->submission?->rejected_at)?->toISOString(),
                    'admin_comment' => $this->submission?->admin_comment,
                ];
            }),
        ];
    }
}
