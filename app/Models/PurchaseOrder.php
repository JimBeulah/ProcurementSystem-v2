<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class PurchaseOrder extends Model
{
    use LogsActivity, SoftDeletes;

    const STATUS_PENDING = 'PENDING';
    const STATUS_APPROVED = 'APPROVED';
    const STATUS_DECLINED = 'DECLINED';
    const STATUS_COMPLETED = 'COMPLETED';
    const STATUS_CANCELLED = 'CANCELLED';
    const STATUS_PARTIALLY_DELIVERED = 'PARTIALLY DELIVERED';

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'remarks', 'project_id', 'supplier_id', 'total_amount'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected $fillable = [
        'order_date',
        'project_id',
        'supplier_id',
        'requester_id',
        'approver_id',
        'purchase_request_id',
        'status',
        'remarks',
        'total_amount',
    ];

    protected function casts(): array
    {
        return [
            'order_date' => 'datetime',
            'total_amount' => 'decimal:2',
        ];
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approver_id');
    }

    public function purchaseRequest()
    {
        return $this->belongsTo(PurchaseRequest::class);
    }

    public function items()
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function receivingReports()
    {
        return $this->hasMany(ReceivingReport::class);
    }

    public function invoices()
    {
        return $this->hasMany(SupplierInvoice::class);
    }

    public function disbursements()
    {
        return $this->hasMany(Disbursement::class);
    }
}
