<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class StorageTimetablesCors
{
    private const ALLOWED_ORIGINS = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $path = $request->path();
        $origin = $request->headers->get('Origin');
        $allowedOrigin = \in_array($origin, self::ALLOWED_ORIGINS, true) ? $origin : null;

        // Only apply CORS to timetable images served from /storage/timetables/*
        if (str_starts_with($path, 'storage/timetables/')) {
            if ($request->getMethod() === 'OPTIONS') {
                return response('', 204)
                    ->header('Access-Control-Allow-Origin', $allowedOrigin ?? 'http://localhost:3000')
                    ->header('Access-Control-Allow-Methods', 'GET, OPTIONS')
                    ->header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization')
                    ->header('Vary', 'Origin');
            }
        }

        $response = $next($request);

        if (str_starts_with($path, 'storage/timetables/')) {
            $response->headers->set('Access-Control-Allow-Origin', $allowedOrigin ?? 'http://localhost:3000');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization');
            $response->headers->set('Vary', 'Origin');
        }

        return $response;
    }
}
