<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SiteReleaseController extends Controller
{
    public function index()
    {
        $inventory = InventoryItem::with('project')
            ->whereNotNull('project_id')
            ->orderBy('material_name', 'asc')
            ->get();

        return Inertia::render('SiteRelease/Index', ['inventory' => $inventory]);
    }
}
