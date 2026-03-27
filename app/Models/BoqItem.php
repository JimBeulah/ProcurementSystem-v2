<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BoqItem extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'project_id',
        'item_description',
        'unit',
        'material_unit_price',
        'labor_unit_price',
        'quantity',
        'is_carport',
    ];

    protected function casts(): array
    {
        return [
            'material_unit_price' => 'decimal:2',
            'labor_unit_price' => 'decimal:2',
            'quantity' => 'decimal:2',
            'is_carport' => 'boolean',
        ];
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function components()
    {
        return $this->hasMany(BoqItemComponent::class);
    }

    /**
     * Recalculates the unit prices based on current components.
     */
    public function recalculateTotals(): void
    {
        $materialTotal = $this->components()
            ->whereIn('resource_type', ['MATERIAL', 'EQUIPMENT'])
            ->sum('client_total_cost');

        $laborTotal = $this->components()
            ->where('resource_type', 'LABOR')
            ->sum('client_total_cost');

        $this->update([
            'material_unit_price' => $materialTotal,
            'labor_unit_price' => $laborTotal,
        ]);
    }
}
