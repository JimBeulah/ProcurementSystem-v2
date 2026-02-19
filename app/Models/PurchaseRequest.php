<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseRequest extends Model
{
    protected $fillable = [
        'request_date',
        'project_id',
        'requester_id',
        'approver_id',
        'status',
        'purpose',
        'remarks',
        'total_estimated_cost',
    ];

    protected function casts(): array
    {
        return [
            'request_date' => 'datetime',
            'total_estimated_cost' => 'decimal:2',
        ];
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approver_id');
    }

    public function items()
    {
        return $this->hasMany(PurchaseRequestItem::class);
    }
}
