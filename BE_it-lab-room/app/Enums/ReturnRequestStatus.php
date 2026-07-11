<?php

namespace App\Enums;

enum ReturnRequestStatus: string
{
    case PENDING = 'pending';
    case CONFIRMED = 'confirmed';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Chưa trả máy',
            self::CONFIRMED => 'Đã trả máy',
        };
    }
}
