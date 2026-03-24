<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkflowRule extends Model
{
    public $timestamps = false;

    const CREATED_AT = null;

    protected $fillable = [
        'process_type',
        'min_amount',
        'max_amount',
        'approver_role',
        'step_order',
    ];

    protected function casts(): array
    {
        return [
            'min_amount' => 'decimal:2',
            'max_amount' => 'decimal:2',
        ];
    }
}
