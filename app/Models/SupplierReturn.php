<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class SupplierReturn extends Model
{
    use LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'remarks', 'reason', 'return_reference'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected $fillable = [
        'purchase_order_id',
        'project_id',
        'supplier_id',
        'initiated_by_id',
        'approved_by_id',
        'status',
        'reason',
        'remarks',
        'return_reference',
        'returned_date',
    ];

    protected function casts(): array
    {
        return [
            'returned_date' => 'date',
        ];
    }

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function initiatedBy()
    {
        return $this->belongsTo(User::class, 'initiated_by_id');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by_id');
    }

    public function items()
    {
        return $this->hasMany(SupplierReturnItem::class);
    }

    public function getTotalCreditAttribute(): float
    {
        return $this->items->sum(fn ($i) => $i->quantity * $i->unit_price);
    }
}
