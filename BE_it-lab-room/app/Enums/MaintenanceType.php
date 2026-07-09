<?php

namespace App\Enums;

/**
 * Loại bảo trì.
 */
class MaintenanceType
{
    const REPAIR = 'sua_chua';
    const REPLACE_PART = 'thay_the_linh_kien';
    const CLEANING = 've_sinh_bao_duong';

    /**
     * Danh sách tất cả loại bảo trì hợp lệ.
     */
    public static function all(): array
    {
        return [
            self::REPAIR,
            self::REPLACE_PART,
            self::CLEANING,
        ];
    }
}
