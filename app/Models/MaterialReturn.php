<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MaterialReturn extends Model
{
    protected $fillable = [
        'project_id',
        'inventory_item_id',
        'returned_by_id',
        'received_by_id',
        'material_name',
        'quantity',
        'unit',
        'remarks',
        'status',
        'received_at',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'received_at' => 'datetime',
        ];
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class);
    }

    public function returnedBy()
    {
        return $this->belongsTo(User::class, 'returned_by_id');
    }

    public function receivedBy()
    {
        return $this->belongsTo(User::class, 'received_by_id');
    }
}
