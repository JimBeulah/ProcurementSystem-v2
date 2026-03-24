<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupplierController extends Controller
{
    public function index()
    {
        $suppliers = Supplier::orderBy('name', 'asc')->get();

        return Inertia::render('Purchasing/Suppliers/Index', ['suppliers' => $suppliers]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:suppliers,name',
            'contact_person' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:1000',
        ]);

        Supplier::create($validated);

        return redirect()->back()->with('success', 'Supplier added successfully.');
    }

    public function update(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:suppliers,name,'.$supplier->id,
            'contact_person' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:1000',
        ]);

        $supplier->update($validated);

        return redirect()->back()->with('success', 'Supplier updated successfully.');
    }

    public function toggleActive(Supplier $supplier)
    {
        $supplier->update(['is_active' => ! $supplier->is_active]);

        $status = $supplier->is_active ? 'enabled' : 'disabled';

        return redirect()->back()->with('success', "Supplier {$status} successfully.");
    }
}
