<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MaterialRequest extends Model
{
    protected $fillable = [
        'project_id',
        'requester_id',
        'approver_id',
        'request_date',
        'status',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'request_date' => 'datetime',
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
        return $this->hasMany(MaterialRequestItem::class);
    }

    public function rfqs()
    {
        return $this->hasMany(Rfq::class, 'mr_id');
    }
}
