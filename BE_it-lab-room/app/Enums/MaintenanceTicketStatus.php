<?php

namespace App\Enums;

/**
 * Trạng thái phiếu bảo trì.
 */
class MaintenanceTicketStatus
{
    const PENDING = 'pending';
    const IN_PROGRESS = 'in_progress';
    const COMPLETED = 'completed';

    /**
     * Danh sách tất cả trạng thái hợp lệ.
     */
    public static function all(): array
    {
        return [
            self::PENDING,
            self::IN_PROGRESS,
            self::COMPLETED,
        ];
    }
}
