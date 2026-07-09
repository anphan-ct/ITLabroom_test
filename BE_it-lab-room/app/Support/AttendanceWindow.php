<?php

namespace App\Support;

use App\Models\ComputerLabSchedule;
use Carbon\Carbon;

class AttendanceWindow
{
    private const TIMEZONE = 'Asia/Ho_Chi_Minh';

    private const LESSON_END_TIMES = [
        1 => '07:15',
        2 => '08:05',
        3 => '08:55',
        4 => '09:45',
        5 => '10:35',
        6 => '11:25',
        7 => '13:15',
        8 => '14:05',
        9 => '14:55',
        10 => '15:45',
        11 => '16:35',
        12 => '17:30',
    ];

    public static function resolve(ComputerLabSchedule $schedule, bool $syncExpired = true): array
    {
        $closedAt = self::closedAt($schedule);
        $isExpired = $closedAt?->lte(Carbon::now(self::TIMEZONE)) ?? false;

        if ($syncExpired && $schedule->trang_thai === 'open' && $isExpired) {
            // Tự đóng điểm danh khi đã qua giờ kết thúc tiết cuối của lịch học.
            $schedule->forceFill(['trang_thai' => 'closed'])->save();
        }

        if ($schedule->trang_thai === 'open') {
            $status = 'open';
            $statusLabel = 'Đang mở';
        } elseif ($schedule->trang_thai === 'closed') {
            $status = 'closed';
            $statusLabel = 'Đã đóng';
        } elseif (in_array($schedule->trang_thai, ['completed', 'cancelled'], true)) {
            $status = 'closed';
            $statusLabel = 'Đã đóng';
        } else {
            $status = 'not_open';
            $statusLabel = 'Chưa mở';
        }

        return [
            'status' => $status,
            'status_label' => $statusLabel,
            'closed_at' => $closedAt?->format('Y-m-d H:i:s'),
            'is_expired' => $isExpired,
        ];
    }

    public static function closedAt(ComputerLabSchedule $schedule): ?Carbon
    {
        $lessonEndTime = self::LESSON_END_TIMES[(int) $schedule->so_tiet_ket_thuc] ?? null;

        if (! $schedule->ngay_hoc_cu_the || ! $lessonEndTime) {
            return null;
        }

        return Carbon::parse(
            $schedule->ngay_hoc_cu_the->format('Y-m-d') . ' ' . $lessonEndTime,
            self::TIMEZONE
        );
    }
}
