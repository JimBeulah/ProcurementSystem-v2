<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBoqComponentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'resourceType' => 'required|string|in:MATERIAL,LABOR,EQUIPMENT',
            'name' => 'required|string|max:255',
            'quantityFactor' => 'required|numeric|min:0',
            'clientUnitRate' => 'required|numeric|min:0',
            'altapilUnitRate' => 'nullable|numeric|min:0',
            'noOfPersons' => 'nullable|numeric|min:0',
            'hours' => 'nullable|numeric|min:0',
        ];
    }
}
