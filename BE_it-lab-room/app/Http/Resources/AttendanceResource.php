<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $attendance = $this->resource['attendance'] ?? null;
        $student = $this->resource['student'] ?? null;

        return [
            'id' => $attendance?->id,
            'student' => [
                'id' => $student?->id,
                'student_code' => $student?->ma_sinh_vien,
                'full_name' => $student?->user?->ho_ten,
                'email' => $student?->user?->email,
                'class_code' => $student?->class?->ma_lop,
                'course_year' => $student?->nien_khoa,
            ],
            'attendance_status' => $attendance?->trang_thai ?? 'absent',
            'checked_in_at' => $attendance?->thoi_gian_check_in?->format('Y-m-d H:i:s'),
            'checked_in_time' => $attendance?->thoi_gian_check_in?->format('H:i'),
            'note' => $attendance?->ghi_chu,
        ];
    }
}
