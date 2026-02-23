<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function index()
    {
        return Inertia::render('Settings/Index');
    }

    public function users()
    {
        $users = User::with('roles')->orderBy('name')->get()->map(fn($u) => [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'username' => $u->username,
            'role' => $u->role,
            'is_active' => (bool) $u->is_active,
            'must_change_password' => (bool) $u->must_change_password,
            'created_at' => $u->created_at,
        ]);
        return Inertia::render('Settings/Users/Index', ['users' => $users]);
    }

    public function masterData()
    {
        return Inertia::render('Settings/MasterData/Index');
    }

    public function workflows()
    {
        return Inertia::render('Settings/Workflows/Index');
    }
}
