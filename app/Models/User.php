<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
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

    public function rfqs()
    {
        return $this->hasMany(Rfq::class, 'created_by_id');
    }

    public function receivingReports()
    {
        return $this->hasMany(ReceivingReport::class, 'received_by_id');
    }

    public function disbursements()
    {
        return $this->hasMany(Disbursement::class, 'processed_by_id');
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
