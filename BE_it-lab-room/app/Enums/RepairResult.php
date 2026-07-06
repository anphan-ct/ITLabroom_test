<?php

namespace App\Enums;

/**
 * Kết quả sửa chữa trong nhật ký sửa chữa.
 */
class RepairResult
{
    const DANG_XU_LY = 'dang_xu_ly';
    const DA_XU_LY = 'da_xu_ly';
    const KHONG_SUA_DUOC = 'khong_sua_duoc';
    const CAN_THAY_THE = 'can_thay_the';

    /**
     * Danh sách tất cả kết quả hợp lệ.
     */
    public static function all(): array
    {
        return [
            self::DANG_XU_LY,
            self::DA_XU_LY,
            self::KHONG_SUA_DUOC,
            self::CAN_THAY_THE,
        ];
    }

    /**
     * Kết quả khiến máy/thiết bị được cập nhật về trạng thái hoạt động.
     */
    public static function resolved(): string
    {
        return self::DA_XU_LY;
    }
}
