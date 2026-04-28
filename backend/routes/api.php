<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Api\Admin\FiliereController;
use App\Http\Controllers\Api\Admin\ModuleController;
use App\Http\Controllers\Api\Admin\NoteValidationController;
use App\Http\Controllers\Api\Admin\ProfesseurController;
use App\Http\Controllers\Api\Admin\StagiaireController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Common\NotificationController;
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

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/logout', [AuthController::class, 'logout']);

    // Shared notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    // Admin (Directeur)
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::apiResource('filieres', FiliereController::class);
        Route::apiResource('modules', ModuleController::class);
        Route::apiResource('stagiaires', StagiaireController::class);
        Route::apiResource('professeurs', ProfesseurController::class);
        Route::apiResource('groupes', \App\Http\Controllers\Api\Admin\GroupeController::class);

        Route::get('/notes/pending', [NoteValidationController::class, 'indexPending']);
        Route::patch('/notes/{note}/validate', [NoteValidationController::class, 'validateNote']);
        Route::patch('/notes/{note}/reject', [NoteValidationController::class, 'rejectNote']);

        Route::get('/dashboard/stats', [AdminDashboardController::class, 'stats']);
    });

    // Professeur
    Route::middleware('role:professeur')->prefix('professeur')->group(function () {
        Route::get('/notes', [ProfNoteController::class, 'index']);
        Route::post('/notes', [ProfNoteController::class, 'storeOrUpdate']);
        Route::patch('/notes/{note}', [ProfNoteController::class, 'update']);

        Route::get('/students', [ProfStudentController::class, 'index']);
        Route::get('/catalog', [ProfStudentController::class, 'catalog']);
        Route::get('/schedule', [ProfScheduleController::class, 'index']);
    });

    // Stagiaire
    Route::middleware('role:stagiaire')->prefix('stagiaire')->group(function () {
        Route::get('/notes', [StudentPortalController::class, 'notes']);
        Route::get('/schedule', [StudentPortalController::class, 'schedule']);
        Route::get('/announcements', [StudentPortalController::class, 'announcements']);
        Route::get('/ai-recommendation', [StudentPortalController::class, 'aiRecommendation']);
    });
});
