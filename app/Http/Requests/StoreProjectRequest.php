<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'client_id' => 'required|exists:clients,id',
            'location' => 'nullable|string|max:255',
            'budget' => 'required|numeric|min:0',
            'duration' => 'nullable|string|max:100',
            'total_floor_area' => 'nullable|numeric|min:0',
            'carport_area' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|in:ACTIVE,COMPLETED,ON_HOLD',
            'project_type' => 'nullable|string|in:BUILDING,INFRASTRUCTURE,MAINTENANCE',
            'appropriation' => 'nullable|numeric|min:0',
            'source_of_fund' => 'nullable|string|max:255',
            'contract_id' => 'nullable|string|max:100',
            'project_component_id' => 'nullable|string|max:100',
            'net_length' => 'nullable|numeric|min:0',
        ];
    }
}
