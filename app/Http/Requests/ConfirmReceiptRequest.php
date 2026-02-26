<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ConfirmReceiptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $maxQuantity = $this->route('siteRelease')?->quantity_released ?? 0;

        return [
            'quantity_received' => "required|numeric|min:0|max:{$maxQuantity}",
            'receipt_remarks' => 'nullable|string|max:500',
        ];
    }
}
