<?php

namespace App\Enums;

enum ReturnRequestStatus: string
{
    case PENDING = 'pending';
    case CONFIRMED = 'confirmed';
    case NEEDS_INSPECTION = 'needs_inspection';

    public function label(): string
    {
        return match($this) {
            self::PENDING => 'Chờ xác nhận',
            self::CONFIRMED => 'Đã xác nhận',
            self::NEEDS_INSPECTION => 'Cần kiểm tra',
        };
    }
}
