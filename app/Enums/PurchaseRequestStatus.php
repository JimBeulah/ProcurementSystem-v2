<?php

namespace App\Enums;

enum PurchaseRequestStatus: string
{
    case PENDING = 'PENDING';
    case APPROVED = 'APPROVED';
    case PARTIAL = 'PARTIAL';
    case COMPLETED = 'COMPLETED';
    case CANCELLED = 'CANCELLED';
    case DECLINED = 'DECLINED';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Pending',
            self::APPROVED => 'Approved',
            self::PARTIAL => 'Partial',
            self::COMPLETED => 'Completed',
            self::CANCELLED => 'Cancelled',
            self::DECLINED => 'Declined',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::PENDING => 'bg-amber-500/10 text-amber-600 border-amber-500/20',
            self::APPROVED => 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
            self::PARTIAL => 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
            self::COMPLETED => 'bg-blue-500/10 text-blue-600 border-blue-500/20',
            self::CANCELLED => 'bg-slate-500/10 text-slate-500 border-slate-500/20',
            self::DECLINED => 'bg-red-500/10 text-red-600 border-red-500/20',
        };
    }
}
