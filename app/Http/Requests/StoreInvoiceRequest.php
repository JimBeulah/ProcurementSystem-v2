<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'invoice_number' => [
                'required',
                'string',
                'max:255',
                Rule::unique('supplier_invoices')->where(function ($query) {
                    return $query->where('supplier_id', $this->supplier_id);
                }),
            ],
            'supplier_id' => 'required|integer|exists:suppliers,id',
            'purchase_order_id' => 'nullable|integer|exists:purchase_orders,id',
            'receiving_report_id' => 'nullable|integer|exists:receiving_reports,id',
            'total_amount' => 'required|numeric|min:0',
        ];
    }
}
