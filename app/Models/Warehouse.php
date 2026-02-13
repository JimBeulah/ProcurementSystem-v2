<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Warehouse extends Model
{
    public $timestamps = false;

    protected $fillable = ['name', 'location', 'type'];

    public function inventoryItems()
    {
        return $this->hasMany(InventoryItem::class);
    }
}
