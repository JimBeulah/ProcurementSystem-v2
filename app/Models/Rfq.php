<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rfq extends Model
{
    protected $table = 'rfqs';

    protected $fillable = [
        'mr_id',
        'created_by_id',
        'title',
        'status',
        'due_date',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'datetime',
        ];
    }

    public function materialRequest()
    {
        return $this->belongsTo(MaterialRequest::class, 'mr_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function items()
    {
        return $this->hasMany(RfqItem::class);
    }

    public function quotations()
    {
        return $this->hasMany(SupplierQuotation::class);
    }
}
