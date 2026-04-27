<?php

namespace App\Enums;

enum SiteReleaseStatus: string
{
    case AWAITING_APPROVAL = 'AWAITING_APPROVAL';
    case PENDING = 'PENDING';
    case IN_TRANSIT = 'IN_TRANSIT';
    case RECEIVED = 'RECEIVED';
    case CANCELLED = 'CANCELLED';

    public function label(): string
    {
        return match ($this) {
            self::AWAITING_APPROVAL => 'Awaiting Approval',
            self::PENDING => 'Pending Release',
            self::IN_TRANSIT => 'In Transit',
            self::RECEIVED => 'Received at Site',
            self::CANCELLED => 'Cancelled',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::AWAITING_APPROVAL => 'amber',
            self::PENDING => 'blue',
            self::IN_TRANSIT => 'cyan',
            self::RECEIVED => 'emerald',
            self::CANCELLED => 'slate',
        };
    }
}
