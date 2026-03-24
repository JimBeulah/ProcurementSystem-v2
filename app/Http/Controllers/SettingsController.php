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

    public function masterData()
    {
        $suppliers = Supplier::orderBy('name')->get();
        $materials = Material::orderBy('name')->get();
        $warehouses = Warehouse::orderBy('name')->get();

        return Inertia::render('Settings/MasterData/Index', [
            'suppliers' => $suppliers,
            'materials' => $materials,
            'warehouses' => $warehouses,
        ]);
    }

    // --- Suppliers CRUD ---
    public function storeSupplier(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string',
        ]);

        Supplier::create($validated);

        return back()->with('success', 'Supplier created successfully.');
    }

    public function updateSupplier(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string',
        ]);

        $supplier->update($validated);

        return back()->with('success', 'Supplier updated successfully.');
    }

    public function destroySupplier(Supplier $supplier)
    {
        $supplier->delete();

        return back()->with('success', 'Supplier deleted successfully.');
    }

    // --- Materials CRUD ---
    public function storeMaterial(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:255|unique:materials,code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'unit' => 'nullable|string|max:50',
            'category' => 'nullable|string|max:100',
        ]);

        Material::create($validated);

        return back()->with('success', 'Material created successfully.');
    }

    public function updateMaterial(Request $request, Material $material)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:255|unique:materials,code,'.$material->id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'unit' => 'nullable|string|max:50',
            'category' => 'nullable|string|max:100',
        ]);

        $material->update($validated);

        return back()->with('success', 'Material updated successfully.');
    }

    public function destroyMaterial(Material $material)
    {
        $material->delete();

        return back()->with('success', 'Material deleted successfully.');
    }

    // --- Warehouses CRUD ---
    public function storeWarehouse(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'type' => 'required|string|in:CENTRAL,SITE',
        ]);

        Warehouse::create($validated);

        return back()->with('success', 'Warehouse created successfully.');
    }

    public function updateWarehouse(Request $request, Warehouse $warehouse)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'type' => 'required|string|in:CENTRAL,SITE',
        ]);

        $warehouse->update($validated);

        return back()->with('success', 'Warehouse updated successfully.');
    }

    public function destroyWarehouse(Warehouse $warehouse)
    {
        $warehouse->delete();

        return back()->with('success', 'Warehouse deleted successfully.');
    }

    public function workflows()
    {
        return Inertia::render('Settings/Workflows/Index');
    }
}
