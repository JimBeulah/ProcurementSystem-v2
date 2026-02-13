<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReceivingItem extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'receiving_report_id',
        'material_name',
        'quantity_received',
        'status',
    ];

    protected function casts(): array
    {
        return ['quantity_received' => 'decimal:2'];
    }

    public function receivingReport()
    {
        return $this->belongsTo(ReceivingReport::class);
    }
}
