<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'username' => ['required', 'string', 'max:255', 'unique:users,username', 'regex:/^\S+$/'],
            'role' => ['required', 'string', 'exists:roles,name'],
        ], [
            'username.regex' => 'Username must not contain spaces.',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'] ?? null,
            'username' => strtolower($validated['username']),
            'password' => Hash::make('password123'),
            'role' => $validated['role'],
            'is_active' => true,
            'must_change_password' => true,
        ]);

        $user->syncRoles([$validated['role']]);

        return back()->with('success', "User \"{$user->name}\" created. They will be prompted to change their password on first login.");
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', "unique:users,email,{$user->id}"],
            'username' => ['required', 'string', 'max:255', "unique:users,username,{$user->id}", 'regex:/^\S+$/'],
            'role' => ['required', 'string', 'exists:roles,name'],
        ], [
            'username.regex' => 'Username must not contain spaces.',
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'] ?? $user->email,
            'username' => strtolower($validated['username']),
            'role' => $validated['role'],
        ]);

        $user->syncRoles([$validated['role']]);

        return back()->with('success', "User \"{$user->name}\" updated successfully.");
    }

    public function resetPassword(User $user)
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot reset your own password here.');
        }

        $user->update([
            'password' => Hash::make('password123'),
            'must_change_password' => true,
        ]);

        return back()->with('success', "Password for \"{$user->name}\" has been reset. They will be prompted to change it on next login.");
    }

    public function toggleActive(User $user)
    {
        // Prevent deactivating your own account
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot deactivate your own account.');
        }

        $user->update(['is_active' => !$user->is_active]);

        $status = $user->is_active ? 'activated' : 'deactivated';
        return back()->with('success', "User \"{$user->name}\" has been {$status}.");
    }
}
