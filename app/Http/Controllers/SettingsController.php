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
        $users = User::orderBy('created_at', 'desc')->get();
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
