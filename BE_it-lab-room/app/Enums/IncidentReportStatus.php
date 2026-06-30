<?php

namespace App\Enums;

/**
 * Trạng thái báo cáo sự cố — state machine.
 */
class IncidentReportStatus
{
    const OPEN = 'open';
    const CONFIRMED = 'confirmed';
    const PROCESSING = 'processing';
    const RESOLVED = 'resolved';
    const REJECTED = 'rejected';

    /**
     * Danh sách tất cả trạng thái hợp lệ.
     */
    public static function all(): array
    {
        return [
            self::OPEN,
            self::CONFIRMED,
            self::PROCESSING,
            self::RESOLVED,
            self::REJECTED,
        ];
    }

    /**
     * Các trạng thái cuối (terminal) — không cho phép chuyển tiếp.
     */
    public static function terminal(): array
    {
        return [self::RESOLVED, self::REJECTED];
    }

    /**
     * Kiểm tra hành động có hợp lệ với trạng thái hiện tại không.
     * confirm: chỉ từ open
     * reject: từ open hoặc confirmed
     */
    public static function canPerformAction(string $currentStatus, string $action): bool
    {
        $allowed = [
            'confirm' => [self::OPEN],
            'reject'  => [self::OPEN, self::CONFIRMED],
        ];

        return in_array($currentStatus, $allowed[$action] ?? [], true);
    }
}
