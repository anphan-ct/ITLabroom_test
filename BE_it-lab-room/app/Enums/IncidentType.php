<?php

namespace App\Enums;

/**
 * Loại sự cố — dùng cho báo cáo sự cố.
 */
class IncidentType
{
    const PHAN_CUNG = 'phan_cung';
    const PHAN_MEM = 'phan_mem';
    const MAN_HINH = 'man_hinh';
    const NGOAI_VI = 'ngoai_vi';
    const MANG = 'mang';
    const THIET_BI_PHONG = 'thiet_bi_phong';

    /**
     * Danh sách tất cả loại sự cố hợp lệ.
     */
    public static function all(): array
    {
        return [
            self::PHAN_CUNG,
            self::PHAN_MEM,
            self::MAN_HINH,
            self::NGOAI_VI,
            self::MANG,
            self::THIET_BI_PHONG,
        ];
    }
}
