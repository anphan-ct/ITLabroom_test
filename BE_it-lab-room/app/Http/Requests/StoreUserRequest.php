<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Lấy vai trò từ request để xác định rules động
        $roleId = (int) $this->input('ma_vai_tro');

        $rules = [
            // Các trường bắt buộc cho tất cả vai trò
            'ma_vai_tro' => ['required', 'integer', 'exists:vai_tro,id'],
            'ho_ten' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:nguoi_dung,email'],
            'mat_khau' => ['required', 'string', 'min:6', 'max:255'],

            // Các trường tùy chọn
            'so_dien_thoai' => ['nullable', 'string', 'max:20'],
            'gioi_tinh' => ['nullable', 'string', 'in:Nam,Nữ,Khác'],
            'ngay_sinh' => ['nullable', 'date'],
        ];

        // Sinh viên (ma_vai_tro = 2): bắt buộc mã sinh viên, lớp, niên khóa
        if ($roleId === 2) {
            $rules['ma_sinh_vien'] = ['required', 'string', 'max:50', 'unique:sinh_vien,ma_sinh_vien'];
            $rules['ma_lop'] = ['required', 'integer', 'exists:lop_hoc,id'];
            $rules['nien_khoa'] = ['required', 'string', 'max:20'];
        }

        // Giảng viên (ma_vai_tro = 3): bắt buộc mã giảng viên, phòng ban
        if ($roleId === 3) {
            $rules['ma_giang_vien'] = ['required', 'string', 'max:50', 'unique:giang_vien,ma_giang_vien'];
            $rules['ma_phong_ban'] = ['required', 'integer', 'exists:phong_ban,id'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'ma_vai_tro.required' => 'Vui lòng chọn vai trò.',
            'ma_vai_tro.exists' => 'Vai trò không hợp lệ.',
            'ho_ten.required' => 'Vui lòng nhập họ tên.',
            'ho_ten.max' => 'Họ tên không được vượt quá 255 ký tự.',
            'email.required' => 'Vui lòng nhập email.',
            'email.email' => 'Email không hợp lệ.',
            'email.unique' => 'Email đã tồn tại trong hệ thống.',
            'mat_khau.required' => 'Vui lòng nhập mật khẩu.',
            'mat_khau.min' => 'Mật khẩu phải có ít nhất 6 ký tự.',
            'so_dien_thoai.max' => 'Số điện thoại không được vượt quá 20 ký tự.',
            'gioi_tinh.in' => 'Giới tính không hợp lệ.',
            'ngay_sinh.date' => 'Ngày sinh không hợp lệ.',

            // Sinh viên
            'ma_sinh_vien.required' => 'Vui lòng nhập mã sinh viên.',
            'ma_sinh_vien.unique' => 'Mã sinh viên đã tồn tại.',
            'ma_sinh_vien.max' => 'Mã sinh viên không được vượt quá 50 ký tự.',
            'ma_lop.required' => 'Vui lòng chọn lớp học.',
            'ma_lop.exists' => 'Lớp học không tồn tại.',
            'nien_khoa.required' => 'Vui lòng nhập niên khóa.',
            'nien_khoa.max' => 'Niên khóa không được vượt quá 20 ký tự.',

            // Giảng viên
            'ma_giang_vien.required' => 'Vui lòng nhập mã giảng viên.',
            'ma_giang_vien.unique' => 'Mã giảng viên đã tồn tại.',
            'ma_giang_vien.max' => 'Mã giảng viên không được vượt quá 50 ký tự.',
            'ma_phong_ban.required' => 'Vui lòng chọn phòng ban.',
            'ma_phong_ban.exists' => 'Phòng ban không tồn tại.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'status' => false,
            'message' => 'Dữ liệu không hợp lệ',
            'error_code' => 422,
            'data' => $validator->errors(),
        ], 422));
    }
}
