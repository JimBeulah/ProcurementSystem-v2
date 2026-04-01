<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

/**
 * @property int $id
 * @property \Illuminate\Support\Carbon $request_date
 * @property int $project_id
 * @property int $requester_id
 * @property int|null $approver_id
 * @property string $status
 * @property string $purpose
 * @property string|null $remarks
 * @property float $total_estimated_cost
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * 
 * @property-read \App\Models\Project $project
 * @property-read \App\Models\User $requester
 * @property-read \App\Models\User|null $approver
 * @property-read \Illuminate\Database\Eloquent\Collection|\App\Models\PurchaseRequestItem[] $items
 * 
 * @mixin \Eloquent
 * @mixin \Illuminate\Database\Eloquent\Builder
 */
class PurchaseRequest extends Model
{
    use LogsActivity, SoftDeletes;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'purpose', 'remarks', 'project_id', 'total_estimated_cost'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

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
