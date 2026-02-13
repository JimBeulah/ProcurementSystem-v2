<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupplierQuotation extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'rfq_id',
        'supplier_id',
        'quote_date',
        'total_amount',
        'currency',
        'is_selected',
    ];

    protected function casts(): array
    {
        return [
            'quote_date' => 'datetime',
            'total_amount' => 'decimal:2',
            'is_selected' => 'boolean',
        ];
    }

    public function rfq()
    {
        return $this->belongsTo(Rfq::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items()
    {
        return $this->hasMany(QuotationItem::class);
    }
}
