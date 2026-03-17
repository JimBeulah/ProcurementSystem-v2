<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Disbursement extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'purchase_order_id',
        'processed_by_id',
        'received_by_id',
        'amount',
        'payment_date',
        'method',
        'reference_number',
        'status',
        'is_liquidated',
        'liquidated_at',
        'receipt_number',
        'receipt_date',
        'liquidation_remarks',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'payment_date' => 'datetime',
            'liquidated_at' => 'datetime',
            'receipt_date' => 'date',
            'is_liquidated' => 'boolean',
        ];
    }

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function processedBy()
    {
        return $this->belongsTo(User::class, 'processed_by_id');
    }

    public function receivedBy()
    {
        return $this->belongsTo(User::class, 'received_by_id');
    }
}
