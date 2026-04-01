<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $purchase_request_id
 * @property string $item_description
 * @property float $quantity
 * @property float $ordered_quantity
 * @property string $unit
 * @property float $estimated_unit_cost
 * @property float $estimated_total_cost
 * @property string|null $remarks
 * 
 * @property-read float $remaining_quantity
 * @property-read \App\Models\PurchaseRequest $purchaseRequest
 * @property-read \Illuminate\Database\Eloquent\Collection|\App\Models\PurchaseOrderItem[] $purchaseOrderItems
 * 
 * @mixin \Eloquent
 * @mixin \Illuminate\Database\Eloquent\Builder
 */
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

    protected $appends = [
        'remaining_quantity',
        'supplier_quantity',
        'warehouse_quantity',
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

    public function purchaseOrderItems()
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function siteReleases()
    {
        return $this->hasMany(SiteRelease::class);
    }

    public function getSupplierQuantityAttribute()
    {
        return $this->purchaseOrderItems()->sum('quantity');
    }

    public function getWarehouseQuantityAttribute()
    {
        return $this->siteReleases()->sum('quantity_released');
    }
}
