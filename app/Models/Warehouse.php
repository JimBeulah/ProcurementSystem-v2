<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Warehouse extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = ['name', 'location', 'type'];

    public function inventoryItems()
    {
        return $this->hasMany(InventoryItem::class);
    }
}
