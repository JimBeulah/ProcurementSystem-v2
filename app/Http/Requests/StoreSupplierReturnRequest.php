<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSupplierReturnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create purchase orders');
    }

    public function rules(): array
    {
        return [
            'purchase_order_id' => 'nullable|exists:purchase_orders,id',
            'project_id' => 'required|exists:projects,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'reason' => 'required|string|max:500',
            'remarks' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.material_name' => 'required|string|max:255',
            'items.*.unit' => 'required|string|max:50',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'nullable|numeric|min:0',
            'items.*.notes' => 'nullable|string|max:255',
            'items.*.purchase_order_item_id' => 'nullable|exists:purchase_order_items,id',
        ];
    }
}
