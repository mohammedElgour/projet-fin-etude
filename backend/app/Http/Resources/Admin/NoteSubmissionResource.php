<?php

namespace App\Http\Resources\Admin;

use App\Models\Note;
use App\Models\NoteSubmission;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NoteSubmissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $status = $this->submitted_at
            ? $this->status
            : Note::STATUS_DRAFT;

        $noteCount = $this->resource instanceof NoteSubmission
            ? ($this->notes_count ?? ($this->relationLoaded('notes') ? $this->notes->count() : 0))
            : 0;

        return [
            'id' => $this->id,
            'groupe_id' => $this->groupe_id,
            'module_id' => $this->module_id,
            'teacher_id' => $this->teacher_id,
            'status' => $status,
            'submitted_at' => optional($this->submitted_at)?->toISOString(),
            'approved_at' => optional($this->approved_at)?->toISOString(),
            'rejected_at' => optional($this->rejected_at)?->toISOString(),
            'admin_comment' => $this->admin_comment,
            'stagiaires_count' => (int) $noteCount,
            'groupe' => $this->whenLoaded('groupe', function () {
                return [
                    'id' => $this->groupe?->id,
                    'nom' => $this->groupe?->nom,
                ];
            }),
            'module' => $this->whenLoaded('module', function () {
                return [
                    'id' => $this->module?->id,
                    'nom' => $this->module?->nom,
                    'code' => $this->module?->code,
                ];
            }),
            'filiere' => $this->whenLoaded('groupe', function () {
                return $this->groupe?->filiere ? [
                    'id' => $this->groupe->filiere->id,
                    'nom' => $this->groupe->filiere->nom,
                ] : null;
            }),
            'teacher' => $this->whenLoaded('teacher', function () {
                return [
                    'id' => $this->teacher?->id,
                    'name' => $this->teacher?->user?->name,
                    'email' => $this->teacher?->user?->email,
                ];
            }),
            'notes' => $this->whenLoaded('notes', function () {
                return $this->notes
                    ->sortBy(fn (Note $note) => mb_strtolower($note->stagiaire?->user?->name ?? ''))
                    ->values()
                    ->map(function (Note $note) {
                        return [
                            'id' => $note->id,
                            'submission_id' => $note->submission_id,
                            'stagiaire_id' => $note->stagiaire_id,
                            'module_id' => $note->module_id,
                            'cc1' => $note->cc1 !== null ? (float) $note->cc1 : null,
                            'cc2' => $note->cc2 !== null ? (float) $note->cc2 : null,
                            'cc3' => $note->cc3 !== null ? (float) $note->cc3 : null,
                            'efm' => $note->efm !== null ? (float) $note->efm : null,
                            'moyenne' => $note->note !== null ? (float) $note->note : null,
                            'status' => $note->workflowStatus(),
                            'feedback' => $note->feedback,
                            'updated_at' => optional($note->updated_at)?->toISOString(),
                            'stagiaire' => [
                                'id' => $note->stagiaire?->id,
                                'name' => $note->stagiaire?->user?->name ?: 'Stagiaire',
                                'email' => $note->stagiaire?->user?->email,
                            ],
                        ];
                    })
                    ->all();
            }),
        ];
    }
}
