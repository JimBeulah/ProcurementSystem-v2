<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteRelease extends Model
{
    protected $fillable = [
        'inventory_item_id',
        'project_id',
        'released_by_id',
        'issued_to',
        'quantity_released',
        'unit',
        'purpose',
        'release_date',
    ];

    protected function casts(): array
    {
        return [
            'quantity_released' => 'decimal:2',
            'release_date' => 'datetime',
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
}
