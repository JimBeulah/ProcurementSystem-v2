<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseRequestItem extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'purchase_request_id',
        'item_description',
        'quantity',
        'ordered_quantity',
        'unit',
        'estimated_unit_cost',
        'estimated_total_cost',
        'remarks',
    ];

    public function getRemainingQuantityAttribute()
    {
        return $this->quantity - $this->ordered_quantity;
    }

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'estimated_unit_cost' => 'decimal:2',
            'estimated_total_cost' => 'decimal:2',
        ];
    }

    public function purchaseRequest()
    {
        return $this->belongsTo(PurchaseRequest::class);
    }
}
