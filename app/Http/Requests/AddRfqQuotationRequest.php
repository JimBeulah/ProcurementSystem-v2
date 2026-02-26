<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AddRfqQuotationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'supplier_id' => 'required|exists:suppliers,id',
            'items' => 'required|array',
            'items.*.material_name' => 'required|string',
            'items.*.quantity' => 'required|numeric',
            'items.*.unit_price' => 'required|numeric|min:0',
        ];
    }
}
