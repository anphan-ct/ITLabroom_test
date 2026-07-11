<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class TeacherBulkAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ma_may_tinh' => ['nullable', 'integer', 'exists:may_tinh,id'],
            'note' => ['nullable', 'string', 'max:255'],
            'attendances' => ['required', 'array', 'min:1'],
            'attendances.*.student_id' => ['required', 'integer', 'exists:sinh_vien,id'],
            'attendances.*.attendance_status' => ['required', 'string', Rule::in(['present', 'absent'])],
        ];
    }

    public function messages(): array
    {
        return [
            'ma_may_tinh.integer' => 'Máy tính không hợp lệ.',
            'ma_may_tinh.exists' => 'Máy tính không tồn tại.',
            'note.string' => 'Ghi chú điểm danh không hợp lệ.',
            'note.max' => 'Ghi chú điểm danh không được vượt quá 255 ký tự.',
            'attendances.required' => 'Vui lòng gửi danh sách điểm danh.',
            'attendances.array' => 'Danh sách điểm danh không hợp lệ.',
            'attendances.min' => 'Danh sách điểm danh không được để trống.',
            'attendances.*.student_id.required' => 'Vui lòng chọn sinh viên.',
            'attendances.*.student_id.integer' => 'Sinh viên không hợp lệ.',
            'attendances.*.student_id.exists' => 'Sinh viên không tồn tại.',
            'attendances.*.attendance_status.required' => 'Vui lòng chọn trạng thái điểm danh.',
            'attendances.*.attendance_status.in' => 'Trạng thái điểm danh không hợp lệ.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'status' => false,
            'message' => 'Dữ liệu điểm danh không hợp lệ',
            'error_code' => 422,
            'data' => $validator->errors(),
        ], 422));
    }
}
