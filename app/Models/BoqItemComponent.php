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
        'unit_rate',
        'total_cost',
        'no_of_persons',
        'hours',
    ];

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::saved(function (BoqItemComponent $component) {
            $component->boqItem?->recalculateTotals();
        });

        static::deleted(function (BoqItemComponent $component) {
            $component->boqItem?->recalculateTotals();
        });
    }

    protected function casts(): array
    {
        return [
            'quantity_factor' => 'decimal:4',
            'unit_rate' => 'decimal:2',
            'total_cost' => 'decimal:2',
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
