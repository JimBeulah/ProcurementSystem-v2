<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupplierReturnItem extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'supplier_return_id',
        'purchase_order_item_id',
        'material_name',
        'unit',
        'quantity',
        'unit_price',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'unit_price' => 'decimal:2',
        ];
    }

    public function supplierReturn()
    {
        return $this->belongsTo(SupplierReturn::class);
    }

    public function purchaseOrderItem()
    {
        return $this->belongsTo(PurchaseOrderItem::class);
    }
}
