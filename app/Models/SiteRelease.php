<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteRelease extends Model
{
    const STATUS_AWAITING_APPROVAL = 'AWAITING_APPROVAL';
    const STATUS_PENDING = 'PENDING';
    const STATUS_IN_TRANSIT = 'IN_TRANSIT';
    const STATUS_RECEIVED = 'RECEIVED';
    const STATUS_CANCELLED = 'CANCELLED';

    protected $fillable = [
        'inventory_item_id',
        'purchase_order_id',
        'purchase_request_item_id',
        'project_id',
        'released_by_id',
        'issued_to',
        'quantity_released',
        'unit',
        'purpose',
        'release_date',
        'status',
        'received_by_id',
        'received_date',
        'quantity_received',
        'receipt_remarks',
    ];

    protected function casts(): array
    {
        return [
            'quantity_released' => 'decimal:2',
            'quantity_received' => 'decimal:2',
            'release_date' => 'datetime',
            'received_date' => 'datetime',
        ];
    }

    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function releasedBy()
    {
        return $this->belongsTo(User::class, 'released_by_id');
    }

    public function receivedBy()
    {
        return $this->belongsTo(User::class, 'received_by_id');
    }

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function purchaseRequestItem()
    {
        return $this->belongsTo(PurchaseRequestItem::class);
    }
}
