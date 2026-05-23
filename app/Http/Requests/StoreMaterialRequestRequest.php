<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMaterialRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'remarks' => 'nullable|string|max:500',
            'authorize_override' => 'sometimes|boolean',
            'items' => 'required|array|min:1',
            'items.*.boq_item_id' => 'nullable|exists:boq_items,id',
            'items.*.boq_item_component_id' => 'nullable|exists:boq_item_components,id',
            'items.*.is_new_resource' => 'sometimes|boolean',
            'items.*.resource_type' => 'required_if:items.*.is_new_resource,true|nullable|in:MATERIAL,LABOR,EQUIPMENT',
            'items.*.item_description' => 'required|string|max:500',
            'items.*.unit' => 'required|string|max:50',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.material_unit_price' => 'nullable|numeric|min:0',
            'items.*.labor_unit_price' => 'nullable|numeric|min:0',
        ];
    }
}
