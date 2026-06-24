<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAccountIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->is_active) {
            return $next($request);
        }

        return response()->json([
            'message' => 'Votre compte est désactivé. Veuillez contacter l\'administration.',
            'code' => 'account_inactive',
        ], 403);
    }
}
