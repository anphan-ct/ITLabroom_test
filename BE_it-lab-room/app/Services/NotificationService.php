<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

class NotificationService
{
    /**
     * Gửi thông báo cho 1 người dùng cụ thể
     */
    public static function notifyUser(int $maNguoiDung, string $tieuDe, string $noiDung, string $loaiThongBao): void
    {
        Notification::insert([
            'ma_nguoi_dung'  => $maNguoiDung,
            'tieu_de'        => $tieuDe,
            'noi_dung'       => $noiDung,
            'loai_thong_bao' => $loaiThongBao,
            'da_doc'         => 0,
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);
    }

    /**
     * Gửi thông báo cho tất cả người dùng thuộc 1 vai trò
     */
    public static function notifyRole(string $tenVaiTro, string $tieuDe, string $noiDung, string $loaiThongBao): void
    {
        $userIds = User::whereHas('role', function ($query) use ($tenVaiTro) {
            $query->where('ten_vai_tro', $tenVaiTro);
        })->pluck('id');

        if ($userIds->isEmpty()) {
            return;
        }

        $now = now(); // Sử dụng chung 1 biến now cho tất cả để tránh null và đồng bộ thời gian
        $data = $userIds->map(function ($userId) use ($tieuDe, $noiDung, $loaiThongBao, $now) {
            return [
                'ma_nguoi_dung'  => $userId,
                'tieu_de'        => $tieuDe,
                'noi_dung'       => $noiDung,
                'loai_thong_bao' => $loaiThongBao,
                'da_doc'         => 0,
                'created_at'     => $now,
                'updated_at'     => $now,
            ];
        });

        if ($data->isNotEmpty()) {
            Notification::insert($data->toArray());
        }
    }
}
