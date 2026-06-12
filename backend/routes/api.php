<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Api\Admin\FiliereController;
use App\Http\Controllers\Api\Admin\ModuleController;
use App\Http\Controllers\Api\Admin\NoteValidationController;
use App\Http\Controllers\Api\Admin\ProfesseurController;
use App\Http\Controllers\Api\Admin\StagiaireController;
use App\Http\Controllers\Api\Admin\AdminTimetableController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Common\NotificationController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\Professeur\NoteController as ProfNoteController;
use App\Http\Controllers\Api\Professeur\ScheduleController as ProfScheduleController;
use App\Http\Controllers\Api\Professeur\StudentController as ProfStudentController;
use App\Http\Controllers\Api\Stagiaire\StudentPortalController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/logout', [AuthController::class, 'logout']);

    // Shared notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/mark-as-read', [NotificationController::class, 'markAsReadByPayload']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::middleware('role:admin')->get('/groupes', [\App\Http\Controllers\Api\Admin\GroupeController::class, 'index']);

    // Admin (Directeur)
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::apiResource('filieres', FiliereController::class);
        Route::apiResource('modules', ModuleController::class);
        Route::apiResource('stagiaires', StagiaireController::class);
        Route::apiResource('professeurs', ProfesseurController::class);
        Route::apiResource('groupes', \App\Http\Controllers\Api\Admin\GroupeController::class);
        Route::get('/timetables', [AdminTimetableController::class, 'index']);
        Route::post('/timetables', [AdminTimetableController::class, 'store']);
        Route::get('/timetables/{timetable}', [AdminTimetableController::class, 'show']);
        Route::post('/timetables/{timetable}', [AdminTimetableController::class, 'update']);
        Route::delete('/timetables/{timetable}', [AdminTimetableController::class, 'destroy']);

        Route::get('/note-submissions', [NoteValidationController::class, 'submissionsIndex']);
        Route::get('/note-submissions/{submission}', [NoteValidationController::class, 'showSubmission']);
        Route::get('/notes/pending', [NoteValidationController::class, 'indexPending']);
        Route::get('/notes/workflow', [NoteValidationController::class, 'workflow']);
        Route::patch('/notes/{note}/validate', [NoteValidationController::class, 'validateNote']);
        Route::patch('/notes/{note}/reject', [NoteValidationController::class, 'rejectNote']);
        Route::post('/notes/validate-group', [NoteValidationController::class, 'validateGroup']);
        Route::post('/notes/reject-group', [NoteValidationController::class, 'rejectGroup']);
        Route::patch('/notes/{note}', [NoteValidationController::class, 'updateManagedNote']);

        Route::get('/dashboard/stats', [AdminDashboardController::class, 'stats']);
        Route::post('/notifications', [NotificationController::class, 'store']);
    });

    Route::middleware('role:admin')->prefix('directeur')->group(function () {
        Route::get('/notes/workflow', [NoteValidationController::class, 'workflow']);
        Route::post('/notes/validate-group', [NoteValidationController::class, 'validateGroup']);
        Route::post('/notes/reject-group', [NoteValidationController::class, 'rejectGroup']);
        Route::patch('/notes/{note}', [NoteValidationController::class, 'updateManagedNote']);
    });

    Route::middleware('role:stagiaire')->prefix('stagiaire')->group(function () {
        Route::get('/profile', [ProfileController::class, 'show']);
        Route::put('/profile', [ProfileController::class, 'update']);
        Route::get('/notes', [StudentPortalController::class, 'notes']);
        Route::get('/releve-de-notes', [StudentPortalController::class, 'transcript']);
        Route::get('/emploi-du-temps', [StudentPortalController::class, 'emploiDuTemps']);
        Route::get('/schedule', [StudentPortalController::class, 'schedule']);
        Route::get('/timetables', [AdminTimetableController::class, 'index']);
        Route::get('/timetables/{timetable}', [AdminTimetableController::class, 'show']);
        Route::get('/announcements', [StudentPortalController::class, 'announcements']);
        Route::get('/ai-recommendation', [StudentPortalController::class, 'aiRecommendation']);
    });

    // Professeur
    Route::middleware('role:professeur')->prefix('professeur')->group(function () {
        Route::get('/profile', [ProfileController::class, 'show']);
        Route::put('/profile', [ProfileController::class, 'update']);
        Route::get('/notes', [ProfNoteController::class, 'index']);
        Route::post('/notes/batch', [ProfNoteController::class, 'saveBatch']);
        Route::post('/notes/submit', [ProfNoteController::class, 'submitBatch']);
        Route::post('/notes', [ProfNoteController::class, 'storeOrUpdate']);
        Route::patch('/notes/{note}', [ProfNoteController::class, 'update']);

        // Groupe/Module -> Stagiaires list
        Route::get('/stagiaires', [\App\Http\Controllers\Api\Professeur\ProfStagiairesController::class, 'index']);

        Route::get('/students', [ProfStudentController::class, 'index']);
        Route::get('/catalog', [ProfStudentController::class, 'catalog']);
        Route::get('/emploi-du-temps', [ProfScheduleController::class, 'emploiDuTemps']);
        Route::get('/schedule', [ProfScheduleController::class, 'index']);
        Route::get('/timetables', [AdminTimetableController::class, 'index']);
        Route::get('/timetables/{timetable}', [AdminTimetableController::class, 'show']);
    });
});
