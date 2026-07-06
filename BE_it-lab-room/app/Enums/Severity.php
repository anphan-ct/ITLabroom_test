<?php

namespace App\Enums;

/**
 * Mức độ sự cố — dùng cho báo cáo sự cố.
 */
class Severity
{
    const THAP = 'thap';
    const TRUNG_BINH = 'trung_binh';
    const CAO = 'cao';

    /**
     * Danh sách tất cả mức độ hợp lệ.
     */
    public static function all(): array
    {
        return [
            self::THAP,
            self::TRUNG_BINH,
            self::CAO,
        ];
    }
}
