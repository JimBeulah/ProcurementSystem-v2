<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\MaterialReturn;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MaterialReturnController extends Controller
{
    public function index(): Response
    {
        $returns = MaterialReturn::with(['project', 'returnedBy', 'receivedBy'])
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        $projects = Project::where('status', 'ACTIVE')->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Inventory/MaterialReturns/Index', [
            'returns' => $returns,
            'projects' => $projects,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'material_name' => 'required|string|max:255',
            'quantity' => 'required|numeric|min:0.01',
            'unit' => 'required|string|max:50',
            'remarks' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated) {
            $return = MaterialReturn::create([
                ...$validated,
                'returned_by_id' => Auth::id(),
                'status' => 'PENDING',
            ]);

            return $return;
        });

        return redirect()->back()->with('success', 'Material return submitted. Warehouse will confirm receipt.');
    }

    /**
     * Warehouse confirms the return receipt — increments inventory.
     */
    public function receive(Request $request, MaterialReturn $materialReturn): RedirectResponse
    {
        abort_if($materialReturn->status === 'RECEIVED', 403, 'Already received.');

        DB::transaction(function () use ($materialReturn) {
            // 1. Update the return record
            $materialReturn->update([
                'status' => 'RECEIVED',
                'received_by_id' => Auth::id(),
                'received_at' => now(),
            ]);

            // 2. Merge back into inventory
            $existing = InventoryItem::where('material_name', 'LIKE', '%' . $materialReturn->material_name . '%')
                ->whereNull('project_id') // General warehouse stock
                ->first();

            if ($existing) {
                $existing->increment('quantity', (float) $materialReturn->quantity);
            } else {
                InventoryItem::create([
                    'material_name' => $materialReturn->material_name,
                    'quantity' => $materialReturn->quantity,
                    'unit' => $materialReturn->unit,
                    'project_id' => null,
                    'warehouse_id' => null,
                ]);
            }
        });

        return redirect()->back()->with('success', 'Return received and inventory updated.');
    }
}
