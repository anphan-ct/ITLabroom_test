<?php

namespace App\Http\Requests;

use App\Enums\IncidentType;
use App\Enums\Severity;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

/**
 * Validate dữ liệu tạo báo cáo sự cố (dùng chung student/teacher/admin).
 */
class IncidentReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ma_may_tinh' => 'nullable|integer|exists:may_tinh,id',
            'ma_thiet_bi' => 'nullable|integer|exists:thiet_bi,id',
            'loai_su_co'  => ['required', 'string', Rule::in(IncidentType::all())],
            'tieu_de'     => 'required|string|max:255',
            'mo_ta'       => 'nullable|string',
            'muc_do'      => ['required', 'string', Rule::in(Severity::all())],
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

            $hasMayTinh  = !is_null($this->input('ma_may_tinh'));
            $hasThietBi  = !is_null($this->input('ma_thiet_bi'));

            // Không cho cả 2 đều null
            if (!$hasMayTinh && !$hasThietBi) {
                $validator->errors()->add(
                    'ma_may_tinh',
                    'Phải chọn máy tính hoặc thiết bị để báo cáo sự cố.'
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
            'ma_may_tinh.integer'  => 'Mã máy tính không hợp lệ.',
            'ma_may_tinh.exists'   => 'Máy tính không tồn tại trong hệ thống.',
            'ma_thiet_bi.integer'  => 'Mã thiết bị không hợp lệ.',
            'ma_thiet_bi.exists'   => 'Thiết bị không tồn tại trong hệ thống.',
            'loai_su_co.required'  => 'Vui lòng chọn loại sự cố.',
            'loai_su_co.in'        => 'Loại sự cố không hợp lệ.',
            'tieu_de.required'     => 'Vui lòng nhập tiêu đề báo cáo.',
            'tieu_de.max'          => 'Tiêu đề không được vượt quá 255 ký tự.',
            'muc_do.required'      => 'Vui lòng chọn mức độ sự cố.',
            'muc_do.in'            => 'Mức độ sự cố không hợp lệ.',
        ];
    }

    /**
     * Khi validate thất bại, trả response JSON theo chuẩn project.
     */
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'status'     => false,
            'message'    => 'Dữ liệu báo cáo sự cố không hợp lệ',
            'error_code' => 422,
            'data'       => $validator->errors(),
        ], 422));
    }
}
