<?php

namespace App\Http\Requests;

use App\Enums\RepairResult;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

/**
 * Validate dữ liệu tạo nhật ký sửa chữa.
 */
class RepairLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ma_phieu_bao_tri' => 'required|integer|exists:phieu_bao_tri,id',
            'ma_may_tinh'      => 'nullable|integer|exists:may_tinh,id',
            'ma_thiet_bi'      => 'nullable|integer|exists:thiet_bi,id',
            'thoi_gian_sua'    => 'required|date',
            'noi_dung_sua'     => 'required|string',
            'ket_qua'          => ['required', 'string', Rule::in(RepairResult::all())],
            'chi_phi'          => 'nullable|numeric|min:0',
        ];
    }

    /**
     * Validate bổ sung: bắt buộc có ĐÚNG 1 trong 2 (ma_may_tinh XOR ma_thiet_bi).
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $hasMayTinh = !is_null($this->input('ma_may_tinh'));
            $hasThietBi = !is_null($this->input('ma_thiet_bi'));

            // Không cho cả 2 đều null
            if (!$hasMayTinh && !$hasThietBi) {
                $validator->errors()->add(
                    'ma_may_tinh',
                    'Phải chọn máy tính hoặc thiết bị để ghi nhật ký sửa chữa.'
                );
            }

            // Không cho cả 2 đều có giá trị
            if ($hasMayTinh && $hasThietBi) {
                $validator->errors()->add(
                    'ma_thiet_bi',
                    'Chỉ được chọn máy tính hoặc thiết bị, không được chọn cả hai.'
                );
            }
        });
    }

    public function messages(): array
    {
        return [
            'ma_phieu_bao_tri.required' => 'Vui lòng chọn phiếu bảo trì.',
            'ma_phieu_bao_tri.exists'   => 'Phiếu bảo trì không tồn tại.',
            'thoi_gian_sua.required'    => 'Vui lòng nhập thời gian sửa.',
            'thoi_gian_sua.date'        => 'Thời gian sửa không hợp lệ.',
            'noi_dung_sua.required'     => 'Vui lòng nhập nội dung sửa chữa.',
            'ket_qua.required'          => 'Vui lòng chọn kết quả sửa chữa.',
            'ket_qua.in'               => 'Kết quả sửa chữa không hợp lệ.',
            'chi_phi.numeric'           => 'Chi phí phải là số.',
            'chi_phi.min'               => 'Chi phí không được âm.',
        ];
    }


    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'status'     => false,
            'message'    => 'Dữ liệu nhật ký sửa chữa không hợp lệ',
            'error_code' => 422,
            'data'       => $validator->errors(),
        ], 422));
    }
}
