<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    protected $fillable = [
        'client_id',
        'name',
        'location',
        'duration',
        'budget',
        'status',
        'total_floor_area',
        'carport_area',
        'appropriation',
        'source_of_fund',
        'contract_id',
        'project_component_id',
        'net_length',
        'project_type',
        'approved_by',
        'approved_at',
        'site_engineer_id',
    ];

    protected function casts(): array
    {
        return [
            'budget' => 'decimal:2',
            'total_floor_area' => 'decimal:2',
            'carport_area' => 'decimal:2',
            'appropriation' => 'decimal:2',
            'net_length' => 'decimal:2',
            'approved_at' => 'datetime',
        ];
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function siteEngineer()
    {
        return $this->belongsTo(User::class, 'site_engineer_id');
    }

    public function scopeForUser($query, $user)
    {
        if ($user && $user->hasRole('site_engineer')) {
            return $query->where('site_engineer_id', $user->id);
        }
        return $query;
    }

    public function teamMembers()
    {
        return $this->hasMany(ProjectMember::class);
    }

    public function boqItems()
    {
        return $this->hasMany(BoqItem::class);
    }

    public function purchaseOrders()
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    public function materialRequests()
    {
        return $this->hasMany(MaterialRequest::class);
    }

    public function financialTransactions()
    {
        return $this->hasMany(FinancialTransaction::class);
    }

    public function inventoryItems()
    {
        return $this->hasMany(InventoryItem::class);
    }
}
