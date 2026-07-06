<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Chuyển dữ liệu user sang payload API cho module quản lý tài khoản.
     * Tự động include thông tin role, student, teacher khi đã eager load.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'role_id' => $this->ma_vai_tro,
            'full_name' => $this->ho_ten,
            'email' => $this->email,
            'phone' => $this->so_dien_thoai,
            'gender' => $this->gioi_tinh,
            'date_of_birth' => $this->ngay_sinh?->format('Y-m-d'),
            'status' => $this->trang_thai,

            // Thông tin vai trò (eager loaded)
            'role' => $this->whenLoaded('role', function () {
                return [
                    'id' => $this->role->id,
                    'role_name' => $this->role->ten_vai_tro,
                    'role_label' => $this->role->mo_ta,
                ];
            }),

            // Thông tin sinh viên (chỉ hiện khi là sinh viên và đã eager load)
            'student' => $this->whenLoaded('student', function () {
                return $this->student ? [
                    'id' => $this->student->id,
                    'student_code' => $this->student->ma_sinh_vien,
                    'class_id' => $this->student->ma_lop,
                    'class_code' => $this->student->class?->ma_lop,
                    'course_year' => $this->student->nien_khoa,
                ] : null;
            }),

            // Thông tin giảng viên (chỉ hiện khi là giảng viên và đã eager load)
            'teacher' => $this->whenLoaded('teacher', function () {
                return $this->teacher ? [
                    'id' => $this->teacher->id,
                    'teacher_code' => $this->teacher->ma_giang_vien,
                    'department_id' => $this->teacher->ma_phong_ban,
                    'department' => $this->teacher->relationLoaded('department') && $this->teacher->department ? [
                        'id' => $this->teacher->department->id,
                        'department_code' => $this->teacher->department->ma_phong_ban,
                        'department_name' => $this->teacher->department->ten_phong_ban,
                    ] : null,
                ] : null;
            }),
        ];
    }
}
