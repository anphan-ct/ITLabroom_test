<?php

namespace App\Http\Requests;

use App\Models\Computer;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class ComputerTransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Danh sách máy tính cần điều chuyển (mảng id, tối thiểu 1 phần tử)
            'may_tinh_ids'   => 'required|array|min:1',
            'may_tinh_ids.*' => 'integer|distinct|exists:may_tinh,id',
            'ma_phong_moi'   => 'required|integer|exists:phong_may,id',
            'ly_do'          => 'required|string|max:255',
            'ghi_chu'        => 'nullable|string',
            'xac_nhan_vuot_suc_chua' => 'nullable|boolean',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $mayTinhIds = $this->input('may_tinh_ids', []);

            // Lấy danh sách phòng hiện tại của các máy được chọn
            $rooms = Computer::whereIn('id', $mayTinhIds)
                ->pluck('ma_phong')
                ->unique();

            // Kiểm tra tất cả máy phải ở cùng một phòng
            if ($rooms->count() > 1) {
                $validator->errors()->add(
                    'may_tinh_ids',
                    'Tất cả máy tính được chọn phải ở cùng một phòng.'
                );
                return;
            }

            // Kiểm tra phòng mới không được trùng phòng hiện tại của các máy
            $currentRoomId = $rooms->first();
            if ((int) $this->input('ma_phong_moi') === (int) $currentRoomId) {
                $validator->errors()->add(
                    'ma_phong_moi',
                    'Phòng mới phải khác phòng hiện tại của các máy tính.'
                );
            }
        });
    }

    public function messages(): array
    {
        return [
            'may_tinh_ids.required'   => 'Vui lòng chọn ít nhất một máy tính cần điều chuyển.',
            'may_tinh_ids.array'      => 'Danh sách máy tính không hợp lệ.',
            'may_tinh_ids.min'        => 'Vui lòng chọn ít nhất một máy tính cần điều chuyển.',
            'may_tinh_ids.*.integer'  => 'Mã máy tính không hợp lệ.',
            'may_tinh_ids.*.distinct' => 'Danh sách máy tính không được trùng lặp.',
            'may_tinh_ids.*.exists'   => 'Một hoặc nhiều máy tính không tồn tại trong hệ thống.',

            'ma_phong_moi.required'   => 'Vui lòng chọn phòng mới.',
            'ma_phong_moi.integer'    => 'Phòng mới không hợp lệ.',
            'ma_phong_moi.exists'     => 'Phòng mới không tồn tại trong hệ thống.',

            'ly_do.required'          => 'Vui lòng nhập lý do điều chuyển.',
            'ly_do.string'            => 'Lý do điều chuyển không hợp lệ.',
            'ly_do.max'               => 'Lý do điều chuyển không được vượt quá 255 ký tự.',

            'ghi_chu.string'          => 'Ghi chú không hợp lệ.',
        ];
    }

    /**
     * Khi validate thất bại, trả response JSON theo chuẩn project.
     */
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'status'     => false,
            'message'    => 'Dữ liệu điều chuyển không hợp lệ',
            'error_code' => 422,
            'data'       => $validator->errors(),
        ], 422));
    }
}
