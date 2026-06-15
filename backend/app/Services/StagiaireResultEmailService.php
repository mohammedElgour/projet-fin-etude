<?php

namespace App\Services;

use App\Mail\ResultsAvailableMail;
use App\Models\Note;
use App\Models\Stagiaire;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class StagiaireResultEmailService
{
    public function notifyIfReady(Stagiaire $stagiaire): bool
    {
        $stagiaire->loadMissing(['user', 'groupe.filiere']);

        $user = $stagiaire->user;
        $email = $user?->email;

        if (! $email) {
            Log::warning('Result email skipped because stagiaire has no email address.', [
                'stagiaire_id' => $stagiaire->id,
                'user_id' => $user?->id,
            ]);

            return false;
        }

        $context = $this->buildTranscriptContext($stagiaire);

        if (! $context['is_ready']) {
            return false;
        }

        $reserved = DB::transaction(function () use ($stagiaire): bool {
            $existing = DB::table('stagiaire_result_emails')
                ->where('stagiaire_id', $stagiaire->id)
                ->lockForUpdate()
                ->first();

            if ($existing) {
                return false;
            }

            DB::table('stagiaire_result_emails')->insert([
                'stagiaire_id' => $stagiaire->id,
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return true;
        });

        if (! $reserved) {
            return false;
        }

        try {
            Log::debug('Preparing results availability email send.', [
                'stagiaire_id' => $stagiaire->id,
                'user_id' => $user->id,
                'email' => $email,
                'mailer' => config('mail.default'),
                'mail_host' => config('mail.mailers.smtp.host'),
                'mail_port' => config('mail.mailers.smtp.port'),
            ]);

            Mail::to($email)->send(new ResultsAvailableMail(
                $user->name ?: trim(($user->first_name ?? '').' '.($user->last_name ?? '')) ?: 'Stagiaire',
                $context['average']
            ));

            Log::info('Results availability email send completed.', [
                'stagiaire_id' => $stagiaire->id,
                'user_id' => $user->id,
                'email' => $email,
                'mailer' => config('mail.default'),
            ]);

            DB::table('stagiaire_result_emails')
                ->where('stagiaire_id', $stagiaire->id)
                ->update([
                    'status' => 'sent',
                    'sent_at' => now(),
                    'failed_at' => null,
                    'error_message' => null,
                    'updated_at' => now(),
                ]);

            return true;
        } catch (Throwable $exception) {
            DB::table('stagiaire_result_emails')
                ->where('stagiaire_id', $stagiaire->id)
                ->update([
                    'status' => 'failed',
                    'failed_at' => now(),
                    'error_message' => mb_substr($exception->getMessage(), 0, 1000),
                    'updated_at' => now(),
                ]);

            Log::error('Failed to send results availability email.', [
                'stagiaire_id' => $stagiaire->id,
                'user_id' => $user->id,
                'email' => $email,
                'average' => $context['average'],
                'message' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
            ]);

            return false;
        }
    }

    private function buildTranscriptContext(Stagiaire $stagiaire): array
    {
        $groupe = $stagiaire->groupe;
        $filiere = $groupe?->filiere;

        $totalModulesCount = (int) ($filiere?->modules()->count() ?? 0);

        $validatedNotesQuery = Note::query()
            ->where('stagiaire_id', $stagiaire->id);

        Note::applyWorkflowStatusFilter($validatedNotesQuery, Note::STATUS_VALIDATED);

        $validatedModulesCount = (int) (clone $validatedNotesQuery)->distinct()->count('module_id');
        $average = (float) ($validatedNotesQuery->avg('note') ?? 0);
        $isReady = $totalModulesCount > 0 && $validatedModulesCount === $totalModulesCount;

        return [
            'is_ready' => $isReady,
            'average' => round($average, 2),
        ];
    }
}
