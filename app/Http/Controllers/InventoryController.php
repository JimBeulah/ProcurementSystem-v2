<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use Inertia\Inertia;

class InventoryController extends Controller
{
    public function index()
    {
        $items = InventoryItem::with('project')
            ->orderBy('material_name', 'asc')
            ->get();

        return Inertia::render('Inventory/Index', ['inventory' => $items]);
    }
}
