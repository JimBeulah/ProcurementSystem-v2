<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReceivingReport extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'purchase_order_id',
        'received_by_id',
        'received_date',
        'delivery_note_no',
        'notes',
    ];

    protected function casts(): array
    {
        return ['received_date' => 'datetime'];
    }

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function receivedBy()
    {
        return $this->belongsTo(User::class, 'received_by_id');
    }

    public function items()
    {
        return $this->hasMany(ReceivingItem::class);
    }

    public function invoices()
    {
        return $this->hasMany(SupplierInvoice::class);
    }
}
