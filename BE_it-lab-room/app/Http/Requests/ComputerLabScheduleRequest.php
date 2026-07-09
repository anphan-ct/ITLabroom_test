<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class ComputerLabScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        if ($this->isMethod('GET')) {
            return [
                'keyword' => ['nullable', 'string', 'max:255'],
                'room_id' => ['nullable', 'integer', 'exists:phong_may,id'],
                'week_id' => ['nullable', 'integer', 'exists:tuan,id'],
                'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            ];
        }

        return [
            'ma_phong' => ['required', 'integer', 'exists:phong_may,id'],
            'ma_lop' => ['nullable', 'integer', 'exists:lop_hoc,id'],
            'ma_lop_hoc_phan' => ['required', 'integer', 'exists:lop_hoc_phan,id'],
            'ma_giang_vien' => ['required', 'integer', 'exists:giang_vien,id'],
            'ma_tuan' => ['required', 'integer', 'exists:tuan,id'],
            'ngay_hoc_cu_the' => ['required', 'date_format:Y-m-d'],
            'thu_trong_tuan' => [
                'required',
                'string',
                Rule::in(['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']),
            ],
            'so_tiet_bat_dau' => ['required', 'integer', 'min:1', 'max:12'],
            'so_tiet_ket_thuc' => ['required', 'integer', 'min:1', 'max:12', 'gte:so_tiet_bat_dau'],
            'loai_lich' => ['required', 'string', Rule::in(['LyThuyet', 'ThucHanh', 'ChinhThuc', 'DatPhong', 'BoSung'])],
            'ma_dat_phong_may' => ['nullable', 'integer', 'exists:dat_phong_may,id'],
            'trang_thai' => ['required', 'string', Rule::in(['scheduled', 'completed', 'cancelled', 'open', 'closed'])],
            'ghi_chu' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'keyword.string' => 'Từ khóa tìm kiếm không hợp lệ.',
            'keyword.max' => 'Từ khóa tìm kiếm không được vượt quá 255 ký tự.',
            'room_id.integer' => 'Phòng máy không hợp lệ.',
            'room_id.exists' => 'Phòng máy không tồn tại.',
            'week_id.integer' => 'Tuần học không hợp lệ.',
            'week_id.exists' => 'Tuần học không tồn tại.',
            'per_page.integer' => 'Số dòng mỗi trang phải là số nguyên.',
            'per_page.min' => 'Số dòng mỗi trang phải từ 1 trở lên.',
            'per_page.max' => 'Số dòng mỗi trang không được vượt quá 100.',

            'ma_phong.required' => 'Vui lòng chọn phòng máy.',
            'ma_phong.exists' => 'Phòng máy không tồn tại.',
            'ma_lop.exists' => 'Lớp học không tồn tại.',
            'ma_lop_hoc_phan.required' => 'Vui lòng chọn lớp học phần.',
            'ma_lop_hoc_phan.exists' => 'Lớp học phần không tồn tại.',
            'ma_giang_vien.required' => 'Vui lòng chọn giảng viên.',
            'ma_giang_vien.exists' => 'Giảng viên không tồn tại.',
            'ma_tuan.required' => 'Vui lòng chọn tuần.',
            'ma_tuan.exists' => 'Tuần học không tồn tại.',
            'ngay_hoc_cu_the.required' => 'Vui lòng chọn ngày học.',
            'ngay_hoc_cu_the.date_format' => 'Ngày học phải có định dạng Y-m-d.',
            'thu_trong_tuan.required' => 'Vui lòng chọn thứ trong tuần.',
            'thu_trong_tuan.in' => 'Thứ trong tuần không hợp lệ.',
            'so_tiet_bat_dau.required' => 'Vui lòng nhập tiết bắt đầu.',
            'so_tiet_bat_dau.integer' => 'Tiết bắt đầu phải là số nguyên.',
            'so_tiet_bat_dau.min' => 'Tiết bắt đầu phải từ 1 trở lên.',
            'so_tiet_bat_dau.max' => 'Tiết bắt đầu không được vượt quá 12.',
            'so_tiet_ket_thuc.required' => 'Vui lòng nhập tiết kết thúc.',
            'so_tiet_ket_thuc.integer' => 'Tiết kết thúc phải là số nguyên.',
            'so_tiet_ket_thuc.gte' => 'Tiết kết thúc phải lớn hơn hoặc bằng tiết bắt đầu.',
            'so_tiet_ket_thuc.max' => 'Tiết kết thúc không được vượt quá 12.',
            'loai_lich.required' => 'Vui lòng chọn loại lịch.',
            'loai_lich.in' => 'Loại lịch không hợp lệ.',
            'ma_dat_phong_may.exists' => 'Yêu cầu đặt phòng không tồn tại.',
            'trang_thai.required' => 'Vui lòng chọn trạng thái lịch.',
            'trang_thai.in' => 'Trạng thái lịch không hợp lệ.',
            'ghi_chu.string' => 'Ghi chú không hợp lệ.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'status' => false,
            'message' => $this->isMethod('GET')
                ? 'Dữ liệu lọc lịch phòng máy không hợp lệ'
                : 'Dữ liệu lịch phòng máy không hợp lệ',
            'error_code' => 422,
            'data' => $validator->errors(),
        ], 422));
    }
}
