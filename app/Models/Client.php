<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    protected $fillable = [
        'name',
        'contact_person',
        'contract_type',
        'payment_terms',
    ];

    public function projects()
    {
        return $this->hasMany(Project::class);
    }
}
