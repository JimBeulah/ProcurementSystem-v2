<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'duration_days' => 'nullable|integer|min:0',
            'target_start_date' => 'nullable|date',
            'target_end_date' => 'nullable|date|after_or_equal:target_start_date',
            'total_floor_area' => 'nullable|numeric|min:0',
            'carport_area' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|in:ACTIVE,PLANNING,COMPLETED,ON_HOLD,WARRANTY_PERIOD',
            'project_type' => ['nullable', 'string', Rule::exists('project_types', 'name')],
            'appropriation' => 'nullable|numeric|min:0',
            'source_of_fund' => 'nullable|string|max:255',
            'contract_id' => 'nullable|string|max:100',
            'project_component_id' => 'nullable|string|max:100',
            'contract_type' => 'nullable|string|max:100',
            'payment_terms' => 'nullable|string|max:100',
            'net_length' => 'nullable|numeric|min:0',
            'site_engineer_id' => 'nullable|exists:users,id',
        ];
    }
}
