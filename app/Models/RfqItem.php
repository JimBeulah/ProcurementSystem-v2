<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RfqItem extends Model
{
    public $timestamps = false;

    protected $fillable = ['rfq_id', 'material_name', 'quantity', 'unit'];

    protected function casts(): array
    {
        return ['quantity' => 'decimal:2'];
    }

    public function rfq()
    {
        return $this->belongsTo(Rfq::class);
    }
}
