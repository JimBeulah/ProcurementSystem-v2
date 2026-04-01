<?php

namespace App\Http\Controllers;

use App\Models\Material;
use App\Models\Supplier;
use App\Models\User;
use App\Models\Warehouse;
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
        $users = User::with('roles')->orderBy('name')->get()->map(fn ($u) => [
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

    public function workflows()
    {
        return Inertia::render('Settings/Workflows/Index');
    }
}

