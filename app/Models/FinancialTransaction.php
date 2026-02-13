<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FinancialTransaction extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'project_id',
        'date',
        'type',
        'category',
        'description',
        'amount',
        'reference',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'datetime',
            'amount' => 'decimal:2',
            'metadata' => 'array',
        ];
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
