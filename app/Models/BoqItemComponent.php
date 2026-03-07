<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BoqItemComponent extends Model
{
    protected $fillable = [
        'boq_item_id',
        'resource_type',
        'name',
        'unit',
        'quantity_factor',
        'client_unit_rate',
        'client_total_cost',
        'altapil_unit_rate',
        'altapil_total_cost',
        'no_of_persons',
        'hours',
    ];

    protected function casts(): array
    {
        return [
            'quantity_factor' => 'decimal:4',
            'client_unit_rate' => 'decimal:2',
            'client_total_cost' => 'decimal:2',
            'altapil_unit_rate' => 'decimal:2',
            'altapil_total_cost' => 'decimal:2',
            'no_of_persons' => 'decimal:2',
            'hours' => 'decimal:2',
        ];
    }

    public function boqItem()
    {
        return $this->belongsTo(BoqItem::class);
    }

    public function materialRequestItems()
    {
        return $this->hasMany(MaterialRequestItem::class);
    }
}
