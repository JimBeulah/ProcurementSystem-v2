<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBoqItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'item_description' => [
                'required',
                'string',
                'max:500',
                Rule::unique('boq_items')
                    ->where('project_id', $this->route('project')->id)
                    ->whereNull('deleted_at')
                    ->ignore($this->route('boq_item')),
            ],
            'unit' => 'required|string|max:50',
            'quantity' => 'required|numeric|min:0',
            'material_unit_price' => 'nullable|numeric|min:0',
            'labor_unit_price' => 'nullable|numeric|min:0',
            'is_carport' => 'nullable|boolean',
            'nature'     => 'nullable|in:DIRECT_MATERIAL,SERVICE,BUNDLE',
            'components' => 'nullable|array',
            'components.*.resourceType' => 'required|string|in:MATERIAL,LABOR,EQUIPMENT',
            'components.*.name' => 'required|string|max:255',
            'components.*.quantityFactor' => 'required|numeric|min:0',
            'components.*.unitRate' => 'required|numeric|min:0',
            'components.*.noOfPersons' => 'nullable|numeric|min:0',
            'components.*.hours' => 'nullable|numeric|min:0',
        ];
    }
}
