<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuotationItem extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'supplier_quotation_id',
        'material_name',
        'quantity',
        'unit_price',
        'total_price',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'unit_price' => 'decimal:2',
            'total_price' => 'decimal:2',
        ];
    }

    public function supplierQuotation()
    {
        return $this->belongsTo(SupplierQuotation::class);
    }
}
