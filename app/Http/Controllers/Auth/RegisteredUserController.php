<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:'.User::class,
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        return DB::transaction(function () use ($request) {
            $isFirstUser = User::count() === 0;

            $user = User::create([
                'name' => $request->name,
                'username' => $request->username,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $isFirstUser ? 'admin' : 'site_engineer',
                'is_active' => $isFirstUser, // First user is enabled, others must be approved
            ]);

            // Assign Spatie Role
            $roleName = $isFirstUser ? 'admin' : 'site_engineer';
            
            // Auto-create role if it doesn't exist (critical for first-boot production)
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            
            // If it's the first user/admin, ensure they have all permissions
            if ($isFirstUser) {
                // We sync all existing permissions to the admin role
                // This ensures that even if seeders haven't run, the first user is a Super Admin
                $allPermissions = \Spatie\Permission\Models\Permission::all();
                if ($allPermissions->isNotEmpty()) {
                    $role->syncPermissions($allPermissions);
                }
            }

            $user->assignRole($role);

            event(new Registered($user));

            Auth::login($user);

            return redirect(route($isFirstUser ? 'dashboard' : 'account.inactive', absolute: false));
        });
    }
}
