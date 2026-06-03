<?php

namespace App\Models;

use App\Enums\MaterialRequestStatus;
use App\Models\BoqItemComponent;
use App\Models\MaterialRequestItem;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Project extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'location', 'budget', 'status', 'client_id'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected $fillable = [
        'client_id',
        'name',
        'location',
        'target_start_date',
        'target_end_date',
        'duration_days',
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
        'contract_type',
        'payment_terms',
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
            'target_start_date' => 'date',
            'target_end_date' => 'date',
            'duration_days' => 'integer',
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
            return $query->where(function ($q) use ($user) {
                $q->where('site_engineer_id', $user->id)
                    ->orWhereHas('teamMembers', function ($sq) use ($user) {
                        $sq->where('user_id', $user->id);
                    });
            });
        }

        return $query;
    }

    public function teamMembers()
    {
        return $this->hasMany(ProjectMember::class);
    }

    public function isMember(User $user): bool
    {
        if ($this->site_engineer_id === $user->id) {
            return true;
        }

        return $this->teamMembers()->where('user_id', $user->id)->exists();
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

    public function disbursements()
    {
        return $this->hasManyThrough(Disbursement::class, PurchaseOrder::class);
    }

    public function invoices()
    {
        return $this->hasManyThrough(SupplierInvoice::class, PurchaseOrder::class);
    }

    public function getTotalBudgetAttribute(): float
    {
        return (float) BoqItemComponent::join('boq_items', 'boq_items.id', '=', 'boq_item_components.boq_item_id')
            ->where('boq_items.project_id', $this->id)
            ->sum('total_cost');
    }

    public function getTotalActualSpendAttribute(): float
    {
        return (float) MaterialRequestItem::join('material_requests', 'material_requests.id', '=', 'material_request_items.material_request_id')
            ->where('material_requests.project_id', $this->id)
            ->whereNotIn('material_requests.status', [
                MaterialRequestStatus::REJECTED->value,
                MaterialRequestStatus::CANCELLED->value,
            ])
            ->sum(DB::raw('material_request_items.quantity * (material_request_items.material_unit_price + material_request_items.labor_unit_price)'));
    }

    public function getProfitOrLossAttribute(): float
    {
        return $this->total_budget - $this->total_actual_spend;
    }
}
