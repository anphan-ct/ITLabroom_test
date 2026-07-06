<?php

namespace App\Enums;

enum ReturnRequestStatus: string
{
    case PENDING = 'pending';
    case CONFIRMED = 'confirmed';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Chờ xác nhận',
            self::CONFIRMED => 'Đã xác nhận',
        };
    }
}
