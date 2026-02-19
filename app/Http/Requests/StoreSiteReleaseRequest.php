<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSiteReleaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'inventory_item_id' => 'required|exists:inventory_items,id',
            'quantity_released' => 'required|numeric|min:0.01',
            'issued_to' => 'required|string|max:255',
            'purpose' => 'nullable|string|max:500',
        ];
    }
}
