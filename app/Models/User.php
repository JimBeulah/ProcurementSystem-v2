<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasRoles, LogsActivity, Notifiable;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'email', 'username', 'role', 'is_active'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected $fillable = [
        'name',
        'email',
        'username',
        'password',
        'role',
        'is_active',
        'must_change_password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'must_change_password' => 'boolean',
        ];
    }

    public function purchaseOrdersRequested()
    {
        return $this->hasMany(PurchaseOrder::class, 'requester_id');
    }

    public function purchaseOrdersApproved()
    {
        return $this->hasMany(PurchaseOrder::class, 'approver_id');
    }

    public function materialRequestsRequested()
    {
        return $this->hasMany(MaterialRequest::class, 'requester_id');
    }

    public function materialRequestsApproved()
    {
        return $this->hasMany(MaterialRequest::class, 'approver_id');
    }

    public function receivingReports()
    {
        return $this->hasMany(ReceivingReport::class, 'received_by_id');
    }

    public function disbursements()
    {
        return $this->hasMany(Disbursement::class, 'processed_by_id');
    }

    public function disbursementsReceived()
    {
        return $this->hasMany(Disbursement::class, 'received_by_id');
    }

    public function projectMembers()
    {
        return $this->hasMany(ProjectMember::class);
    }

    public function projects()
    {
        return $this->belongsToMany(Project::class, 'project_members')->withPivot('role');
    }
}
