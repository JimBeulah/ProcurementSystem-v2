<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryItem extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'material_name',
        'project_id',
        'warehouse_id',
        'quantity',
        'unit',
    ];

    protected function casts(): array
    {
        return ['quantity' => 'decimal:2'];
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }
}
