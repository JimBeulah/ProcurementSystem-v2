<?php

namespace App\Enums;

enum MaterialRequestStatus: string
{
    case PENDING = 'PENDING';
    case APPROVED = 'APPROVED';
    case REJECTED = 'REJECTED';
    case PARTIALLY_FULFILLED = 'PARTIALLY_FULFILLED';
    case FULFILLED = 'FULFILLED';
    case CANCELLED = 'CANCELLED';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Pending',
            self::APPROVED => 'Approved',
            self::REJECTED => 'Rejected',
            self::PARTIALLY_FULFILLED => 'Partially Fulfilled',
            self::FULFILLED => 'Fulfilled',
            self::CANCELLED => 'Cancelled',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::PENDING => 'bg-amber-500/10 text-amber-600 border-amber-500/20',
            self::APPROVED => 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
            self::REJECTED => 'bg-red-500/10 text-red-600 border-red-500/20',
            self::PARTIALLY_FULFILLED => 'bg-blue-500/10 text-blue-600 border-blue-500/20',
            self::FULFILLED => 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
            self::CANCELLED => 'bg-slate-500/10 text-slate-500 border-slate-500/20',
        };
    }
}
