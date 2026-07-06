<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class ComputerUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $computer = $this->route('computer');
        $computerId = $computer?->id;

        return [
            'ma_phong' => ['required', 'integer', 'exists:phong_may,id'],
            'ma_may' => ['required', 'string', 'max:255', Rule::unique('may_tinh', 'ma_may')->ignore($computerId)],
            'ten_may' => [
                'required',
                'string',
                'max:255',
                Rule::unique('may_tinh', 'ten_may')
                    ->where(fn ($query) => $query->where('ma_phong', $this->input('ma_phong')))
                    ->ignore($computerId),
            ],
            'vi_tri' => ['nullable', 'string', 'max:255'],
            'ma_qr' => ['nullable', 'string', 'max:255', Rule::unique('may_tinh', 'ma_qr')->ignore($computerId)],
            'bo_xu_ly' => ['nullable', 'string', 'max:255'],
            'ram' => ['nullable', 'string', 'max:255'],
            'card_do_hoa' => ['nullable', 'string', 'max:255'],
            'bo_mach_chu' => ['nullable', 'string', 'max:255'],
            'man_hinh' => ['nullable', 'string', 'max:255'],
            'ban_phim' => ['nullable', 'string', 'max:255'],
            'chuot' => ['nullable', 'string', 'max:255'],
            'hdd' => ['nullable', 'string', 'max:255'],
            'ssd' => ['nullable', 'string', 'max:255'],
            'trang_thai' => ['required', 'string', 'in:active,broken,maintenance,borrowed'],
            'ghi_chu' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'ma_phong.required' => 'Vui lòng chọn phòng máy.',
            'ma_phong.integer' => 'Phòng máy không hợp lệ.',
            'ma_phong.exists' => 'Phòng máy không tồn tại.',
            'ma_may.required' => 'Vui lòng nhập mã máy.',
            'ma_may.unique' => 'Mã máy đã tồn tại.',
            'ten_may.required' => 'Vui lòng nhập tên máy.',
            'ten_may.unique' => 'Tên máy đã tồn tại trong phòng này.',
            'ma_qr.unique' => 'Mã QR đã tồn tại.',
            'trang_thai.required' => 'Vui lòng chọn trạng thái máy.',
            'trang_thai.in' => 'Trạng thái máy tính không hợp lệ.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'status' => false,
            'message' => 'Dữ liệu máy tính không hợp lệ',
            'error_code' => 422,
            'data' => $validator->errors(),
        ], 422));
    }
}
