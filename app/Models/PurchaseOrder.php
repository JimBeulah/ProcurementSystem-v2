<?php

namespace App\Models;

use App\Enums\PurchaseOrderStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

/**
 * @property int $id
 * @property Carbon $order_date
 * @property int $project_id
 * @property int $supplier_id
 * @property int $requester_id
 * @property int|null $approver_id
 * @property int|null $purchase_request_id
 * @property PurchaseOrderStatus $status
 * @property string|null $remarks
 * @property float $total_amount
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 * @property-read Project $project
 * @property-read Supplier $supplier
 * @property-read User $requester
 * @property-read User|null $approver
 * @property-read PurchaseRequest|null $purchaseRequest
 * @property-read Collection|PurchaseOrderItem[] $items
 *
 * @mixin \Eloquent
 * @mixin Builder
 */
class PurchaseOrder extends Model
{
    use LogsActivity, SoftDeletes;

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
            'status' => PurchaseOrderStatus::class,
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

    public function siteReleases()
    {
        return $this->hasMany(SiteRelease::class);
    }
}
