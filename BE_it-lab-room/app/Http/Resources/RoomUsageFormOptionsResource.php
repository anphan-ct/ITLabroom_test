<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoomUsageFormOptionsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'rooms' => $this->resource['rooms']->map(fn ($room) => [
                'id' => $room->id,
                'code' => $room->ma_phong,
                'name' => $room->ten_phong,
            ]),
            'classes' => $this->resource['classes']->map(fn ($class) => [
                'id' => $class->id,
                'code' => $class->ma_lop,
            ]),
            'course_sections' => $this->resource['courseSections']->map(function ($courseSection) {
                $assignment = $courseSection->assignments->first();
                $teacher = $assignment?->teacher;

                return [
                    'id' => $courseSection->id,
                    'code' => $courseSection->ma_lop_hoc_phan,
                    'subject' => $courseSection->subject?->ten_mon,
                    'class_id' => $courseSection->ma_lop,
                    'class_code' => $courseSection->class?->ma_lop,
                    'room_id' => $courseSection->ma_phong,
                    'room_code' => $courseSection->room?->ma_phong,
                    'room_name' => $courseSection->room?->ten_phong,
                    'teacher_id' => $teacher?->id,
                    'teacher_code' => $teacher?->ma_giang_vien,
                    'teacher_name' => $teacher?->user?->ho_ten,
                ];
            }),
            'teachers' => $this->resource['teachers']->map(fn ($teacher) => [
                'id' => $teacher->id,
                'code' => $teacher->ma_giang_vien,
                'name' => $teacher->user?->ho_ten,
            ]),
            'weeks' => $this->resource['weeks']->map(fn ($week) => [
                'id' => $week->id,
                'number' => $week->so_tuan,
                'start_date' => $week->ngay_bat_dau?->format('Y-m-d'),
                'end_date' => $week->ngay_ket_thuc?->format('Y-m-d'),
                'academic_year' => $week->academicYear?->ten_nam_hoc,
            ]),
        ];
    }
}
