<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsurePasswordIsChanged
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user && $user->must_change_password) {
            // Allow access to the change password route and logout
            if ($request->routeIs('password.change') || $request->routeIs('logout')) {
                return $next($request);
            }

            // For Inertia AJAX requests, return a redirect response that Inertia understands
            if ($request->header('X-Inertia')) {
                return redirect()->route('password.change');
            }

            return redirect()->route('password.change');
        }

        return $next($request);
    }
}
