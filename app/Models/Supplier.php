<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'name',
        'contact_person',
        'email',
        'phone',
        'address',
        'rating',
    ];

    public function quotations()
    {
        return $this->hasMany(SupplierQuotation::class);
    }

    public function purchaseOrders()
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    public function invoices()
    {
        return $this->hasMany(SupplierInvoice::class);
    }
}
