<?php

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/timetable-images/{path}', function (string $path) {
    $storagePath = ltrim($path, '/');
    $origin = request()->headers->get('Origin');
    $allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
    $allowedOrigin = in_array($origin, $allowedOrigins, true) ? $origin : 'http://localhost:3000';

    abort_unless(Storage::disk('public')->exists($storagePath), 404);

    return Storage::disk('public')->response($storagePath, null, [
        'Access-Control-Allow-Origin' => $allowedOrigin,
        'Access-Control-Allow-Methods' => 'GET, OPTIONS',
        'Access-Control-Allow-Headers' => 'Origin, Content-Type, Accept, Authorization',
        'Vary' => 'Origin',
    ]);
})->where('path', '.*');
