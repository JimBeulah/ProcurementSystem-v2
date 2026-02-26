<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReceivingReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'purchase_order_id' => 'required|integer|exists:purchase_orders,id',
            'delivery_note_no' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.material_name' => 'required|string',
            'items.*.quantity_received' => 'required|numeric|min:0',
            'items.*.status' => 'required|string',
        ];
    }
}
