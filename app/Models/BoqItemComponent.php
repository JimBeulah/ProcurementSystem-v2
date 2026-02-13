<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BoqItemComponent extends Model
{
    protected $fillable = [
        'boq_item_id',
        'resource_type',
        'name',
        'quantity_factor',
        'unit_rate',
        'total_component_cost',
        'no_of_persons',
        'hours',
    ];

    protected function casts(): array
    {
        return [
            'quantity_factor' => 'decimal:4',
            'unit_rate' => 'decimal:2',
            'total_component_cost' => 'decimal:2',
            'no_of_persons' => 'decimal:2',
            'hours' => 'decimal:2',
        ];
    }

    public function boqItem()
    {
        return $this->belongsTo(BoqItem::class);
    }
}
