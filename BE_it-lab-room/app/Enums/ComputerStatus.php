<?php

namespace App\Enums;

enum ComputerStatus: string
{
    case ACTIVE = 'active';
    case BROKEN = 'broken';
    case MAINTENANCE = 'maintenance';
    case BORROWED = 'borrowed';

    public function label(): string
    {
        return match($this) {
            self::ACTIVE => 'Hoạt động',
            self::BROKEN => 'Hư hỏng',
            self::MAINTENANCE => 'Bảo trì',
            self::BORROWED => 'Đang mượn',
        };
    }
}
