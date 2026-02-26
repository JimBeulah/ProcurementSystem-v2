<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDisbursementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'purchase_order_id' => 'nullable|integer|exists:purchase_orders,id',
            'amount' => 'required|numeric|min:0',
            'method' => 'required|string|max:100',
            'reference_number' => 'required|string|max:255',
        ];
    }
}
