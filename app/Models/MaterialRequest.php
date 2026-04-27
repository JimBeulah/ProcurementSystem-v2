<?php

namespace App\Models;

use App\Enums\MaterialRequestStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

/**
 * @property MaterialRequestStatus $status
 */
class MaterialRequest extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'remarks', 'project_id'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

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
            'status' => MaterialRequestStatus::class,
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
}
