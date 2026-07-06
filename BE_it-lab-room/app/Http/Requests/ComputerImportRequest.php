<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class ComputerImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ma_phieu_nhap' => 'nullable|string|max:255|unique:phieu_nhap_may,ma_phieu_nhap',
            'ngay_nhap' => 'required|date',
            'so_luong' => 'required|integer|min:1|max:200',
            'ma_phong' => 'required|integer|exists:phong_may,id',
            'nha_cung_cap' => 'nullable|string|max:255',
            'bo_xu_ly' => 'required|string|max:255',
            'ram' => 'required|string|max:255',
            'card_do_hoa' => 'required|string|max:255',
            'bo_mach_chu' => 'required|string|max:255',
            'man_hinh' => 'required|string|max:255',
            'ban_phim' => 'required|string|max:255',
            'chuot' => 'required|string|max:255',
            'hdd' => 'nullable|string|max:255',
            'ssd' => 'nullable|string|max:255',
            'ghi_chu' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'ma_phieu_nhap.string' => 'Mã phiếu nhập không hợp lệ.',
            'ma_phieu_nhap.max' => 'Mã phiếu nhập không được vượt quá 255 ký tự.',
            'ma_phieu_nhap.unique' => 'Mã phiếu nhập đã tồn tại.',

            'ngay_nhap.required' => 'Vui lòng chọn ngày nhập.',
            'ngay_nhap.date' => 'Ngày nhập không hợp lệ.',

            'so_luong.required' => 'Vui lòng nhập số lượng máy.',
            'so_luong.integer' => 'Số lượng máy phải là số nguyên.',
            'so_luong.min' => 'Số lượng máy phải lớn hơn 0.',
            'so_luong.max' => 'Không được nhập quá 200 máy trong một lần.',

            'ma_phong.required' => 'Vui lòng chọn phòng máy.',
            'ma_phong.integer' => 'Phòng máy không hợp lệ.',
            'ma_phong.exists' => 'Phòng máy không tồn tại.',

            'nha_cung_cap.string' => 'Nhà cung cấp không hợp lệ.',
            'nha_cung_cap.max' => 'Nhà cung cấp không được vượt quá 255 ký tự.',

            'bo_xu_ly.required' => 'Vui lòng nhập bộ xử lý.',
            'bo_xu_ly.string' => 'Bộ xử lý không hợp lệ.',
            'bo_xu_ly.max' => 'Bộ xử lý không được vượt quá 255 ký tự.',
            'ram.required' => 'Vui lòng nhập RAM.',
            'ram.string' => 'RAM không hợp lệ.',
            'ram.max' => 'RAM không được vượt quá 255 ký tự.',
            'card_do_hoa.required' => 'Vui lòng chọn card đồ họa.',
            'card_do_hoa.string' => 'Card đồ họa không hợp lệ.',
            'card_do_hoa.max' => 'Card đồ họa không được vượt quá 255 ký tự.',
            'bo_mach_chu.required' => 'Vui lòng nhập bo mạch chủ.',
            'bo_mach_chu.string' => 'Bo mạch chủ không hợp lệ.',
            'bo_mach_chu.max' => 'Bo mạch chủ không được vượt quá 255 ký tự.',
            'man_hinh.required' => 'Vui lòng nhập màn hình.',
            'man_hinh.string' => 'Màn hình không hợp lệ.',
            'man_hinh.max' => 'Màn hình không được vượt quá 255 ký tự.',
            'ban_phim.required' => 'Vui lòng nhập bàn phím.',
            'ban_phim.string' => 'Bàn phím không hợp lệ.',
            'ban_phim.max' => 'Bàn phím không được vượt quá 255 ký tự.',
            'chuot.required' => 'Vui lòng nhập chuột.',
            'chuot.string' => 'Chuột không hợp lệ.',
            'chuot.max' => 'Chuột không được vượt quá 255 ký tự.',
            'hdd.string' => 'HDD không hợp lệ.',
            'hdd.max' => 'HDD không được vượt quá 255 ký tự.',
            'ssd.string' => 'SSD không hợp lệ.',
            'ssd.max' => 'SSD không được vượt quá 255 ký tự.',

            'ghi_chu.string' => 'Ghi chú không hợp lệ.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'status' => false,
            'message' => 'Dữ liệu phiếu nhập không hợp lệ',
            'error_code' => 422,
            'data' => $validator->errors(),
        ], 422));
    }
}
