<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupplierInvoice extends Model
{
    public $timestamps = false;
    const UPDATED_AT = null;

    protected $fillable = [
        'invoice_number',
        'invoice_date',
        'supplier_id',
        'purchase_order_id',
        'receiving_report_id',
        'total_amount',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'invoice_date' => 'datetime',
            'total_amount' => 'decimal:2',
        ];
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function receivingReport()
    {
        return $this->belongsTo(ReceivingReport::class);
    }
}
