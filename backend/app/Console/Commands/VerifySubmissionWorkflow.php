<?php

namespace App\Console\Commands;

use App\Http\Controllers\Api\Admin\NoteValidationController;
use App\Http\Controllers\Api\Professeur\NoteController;
use App\Http\Requests\Api\Professeur\SubmitNotesRequest;
use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Throwable;

#[Signature('verify:submission-workflow')]
#[Description('Verifies professeur submission workflow at controller level with evidence')]
class VerifySubmissionWorkflow extends Command
{
    public function handle(): int
    {
        $controller = app(NoteController::class);
        $adminQueueController = app(NoteValidationController::class);

        $profUser = User::find(3);
        if (!$profUser) {
            $this->error('Professor user with id=3 not found.');
            return self::FAILURE;
        }

        Auth::login($profUser);
        Sanctum::actingAs($profUser);

        $groupeId = 3;
        $moduleId = 11;
        $stagiaireIds = [5, 6, 8];

        $cases = [
            'Contrôle 1' => ['evaluation_type' => 'controle_1', 'field' => 'cc1', 'value' => 11],
            'Contrôle 2' => ['evaluation_type' => 'controle_2', 'field' => 'cc2', 'value' => 12],
            'Contrôle 3' => ['evaluation_type' => 'controle_3', 'field' => 'cc3', 'value' => 13],
            'EFM' => ['evaluation_type' => 'efm', 'field' => 'efm', 'value' => 28],
        ];

        $results = [];

        foreach ($cases as $label => $case) {
            $results[$label] = $this->runCase(
                $controller,
                $groupeId,
                $moduleId,
                $stagiaireIds,
                $case['evaluation_type'],
                $case['field'],
                $case['value']
            );
        }

        $results['Duplicate same evaluation'] = $this->runCase(
            $controller,
            $groupeId,
            $moduleId,
            $stagiaireIds,
            'controle_1',
            'cc1',
            15
        );

        $adminQueueResult = $this->runAdminQueueCheck($adminQueueController, $groupeId, $moduleId);

        $this->line('');
        $this->line('| Test | Result | Notes |');
        $this->line('| --- | --- | --- |');

        foreach (['Contrôle 1', 'Contrôle 2', 'Contrôle 3', 'EFM', 'Duplicate same evaluation'] as $test) {
            $res = $results[$test];
            $this->line(sprintf(
                '| %s | %s | %s |',
                $test,
                $res['ok'] ? 'PASS' : 'FAIL',
                $res['note']
            ));
        }

        $this->line(sprintf(
            '| Admin queue visibility | %s | %s |',
            $adminQueueResult['ok'] ? 'PASS' : 'FAIL',
            $adminQueueResult['note']
        ));

        return self::SUCCESS;
    }

    private function runCase(
        NoteController $controller,
        int $groupeId,
        int $moduleId,
        array $stagiaireIds,
        string $evaluationType,
        string $scoreField,
        float|int $scoreValue
    ): array {
        $this->line('');
        $this->line('=== Scenario: ' . $evaluationType . ' ===');
        $this->line('Controller method: App\Http\Controllers\Api\Professeur\NoteController::submitBatch');

        $beforeSubmissions = DB::table('note_submissions')
            ->where('groupe_id', $groupeId)
            ->where('module_id', $moduleId)
            ->where('evaluation_type', $evaluationType)
            ->orderBy('id')
            ->get()
            ->map(fn ($r) => (array) $r)
            ->all();

        $beforeNotifications = DB::table('notifications')->count();

        $notes = [];
        foreach ($stagiaireIds as $sid) {
            $row = [
                'stagiaire_id' => $sid,
                'module_id' => $moduleId,
                'cc1' => null,
                'cc2' => null,
                'cc3' => null,
                'efm' => null,
            ];
            $row[$scoreField] = $scoreValue;
            $notes[] = $row;
        }

        $payload = [
            'groupe_id' => $groupeId,
            'module_id' => $moduleId,
            'evaluation_type' => $evaluationType,
            'notes' => $notes,
        ];

        $this->line('Payload: ' . json_encode($payload));

        $error = null;
        $responseStatus = null;
        $responseBody = null;

        try {
            $baseRequest = Request::create('/api/professeur/notes/submit', 'POST', $payload);
            $request = SubmitNotesRequest::createFrom($baseRequest);
            $request->setUserResolver(fn () => User::find(3));
            $request->setContainer(app())->setRedirector(app('redirect'));
            $request->validateResolved();
            $response = $controller->submitBatch($request);
            $responseStatus = method_exists($response, 'getStatusCode') ? $response->getStatusCode() : 200;
            $responseBody = method_exists($response, 'getContent') ? $response->getContent() : json_encode($response);
        } catch (Throwable $e) {
            $error = $e;
        }

        $afterSubmissions = DB::table('note_submissions')
            ->where('groupe_id', $groupeId)
            ->where('module_id', $moduleId)
            ->where('evaluation_type', $evaluationType)
            ->orderBy('id')
            ->get()
            ->map(fn ($r) => (array) $r)
            ->all();

        $afterNotifications = DB::table('notifications')->count();

        $this->line('Response status: ' . ($responseStatus ?? 'EXCEPTION'));
        $this->line('Response body: ' . ($responseBody ?? ($error ? $error->getMessage() : 'null')));
        $this->line('note_submissions before: ' . json_encode($beforeSubmissions));
        $this->line('note_submissions after: ' . json_encode($afterSubmissions));
        $this->line('notifications before: ' . $beforeNotifications);
        $this->line('notifications after: ' . $afterNotifications);

        $hasSqlStateError = $error && str_contains($error->getMessage(), 'SQLSTATE');
        $storedRow = !empty($afterSubmissions) ? end($afterSubmissions) : null;
        $storedTypeOk = $storedRow && (($storedRow['evaluation_type'] ?? null) === $evaluationType);
        $submittedAtOk = $storedRow && !empty($storedRow['submitted_at']);
        $statusOk = $storedRow && in_array($storedRow['status'] ?? null, ['pending', 'approved', 'rejected'], true);
        $notifCreated = $afterNotifications >= $beforeNotifications;
        $responseOk = $responseStatus !== null && $responseStatus >= 200 && $responseStatus < 500;

        $ok = !$hasSqlStateError && $responseOk && $storedTypeOk && $submittedAtOk && $statusOk && $notifCreated;

        $noteParts = [];
        if ($error) {
            $noteParts[] = 'Exception=' . $error->getMessage();
        } else {
            $noteParts[] = 'status=' . $responseStatus;
        }
        $noteParts[] = 'stored_type=' . ($storedTypeOk ? 'ok' : 'bad');
        $noteParts[] = 'submitted_at=' . ($submittedAtOk ? 'set' : 'missing');
        $noteParts[] = 'workflow_status=' . ($statusOk ? 'ok' : 'bad');
        $noteParts[] = 'notifications_delta=' . ($afterNotifications - $beforeNotifications);

        return [
            'ok' => $ok,
            'note' => implode('; ', $noteParts),
        ];
    }

    private function runAdminQueueCheck(NoteValidationController $controller, int $groupeId, int $moduleId): array
    {
        $this->line('');
        $this->line('=== Admin queue visibility check ===');
        $this->line('Controller method: App\Http\Controllers\Api\Admin\NoteValidationController::submissionsIndex');

        try {
            $request = Request::create('/api/admin/note-submissions', 'GET', [
                'groupe_id' => $groupeId,
                'module_id' => $moduleId,
            ]);

            $response = $controller->submissionsIndex($request);
            $status = method_exists($response, 'getStatusCode') ? $response->getStatusCode() : 200;
            $body = method_exists($response, 'getContent') ? $response->getContent() : json_encode($response);

            $this->line('Response status: ' . $status);
            $this->line('Response body: ' . $body);

            $ok = $status >= 200 && $status < 400 && str_contains($body, 'evaluation_type');

            return [
                'ok' => $ok,
                'note' => 'status=' . $status . '; contains_evaluation_type=' . (str_contains($body, 'evaluation_type') ? 'yes' : 'no'),
            ];
        } catch (Throwable $e) {
            $this->line('Exception: ' . $e->getMessage());

            return [
                'ok' => false,
                'note' => 'Exception=' . $e->getMessage(),
            ];
        }
    }
}
