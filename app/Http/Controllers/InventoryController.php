<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use Inertia\Inertia;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function index()
    {
        $items = InventoryItem::with('project')
            ->orderBy('material_name', 'asc')
            ->get();

        return Inertia::render('Inventory/Index', ['inventory' => $items]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'material_name' => 'required|string|max:255',
            'quantity' => 'required|numeric|min:0',
            'unit' => 'required|string|max:50',
        ]);

        // Find or create Central Warehouse item (project_id is null)
        $item = InventoryItem::where('material_name', $validated['material_name'])
            ->whereNull('project_id')
            ->first();

        if ($item) {
            $item->quantity += $validated['quantity'];
            $item->save();
        } else {
            InventoryItem::create([
                'material_name' => $validated['material_name'],
                'quantity' => $validated['quantity'],
                'unit' => $validated['unit'],
                'project_id' => null,
                'warehouse_id' => null,
            ]);
        }

        return redirect()->back()->with('success', 'Material added to inventory successfully.');
    }
}
