<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MaterialRequestItem extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'material_request_id',
        'boq_item_id',
        'boq_item_component_id',
        'item_description',
        'description',
        'quantity',
        'material_unit_price',
        'labor_unit_price',
        'unit',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'material_unit_price' => 'decimal:2',
            'labor_unit_price' => 'decimal:2',
        ];
    }

    public function materialRequest()
    {
        return $this->belongsTo(MaterialRequest::class);
    }

    public function boqItem()
    {
        return $this->belongsTo(BoqItem::class);
    }

    public function boqItemComponent()
    {
        return $this->belongsTo(BoqItemComponent::class);
    }
}
