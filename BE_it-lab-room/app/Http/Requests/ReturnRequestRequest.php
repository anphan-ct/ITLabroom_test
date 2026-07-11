<?php

namespace App\Http\Requests;

use App\Models\LoanRequest;
use App\Models\ReturnRequestDetail;
use App\Enums\ReturnRequestStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;
use App\Enums\LoanRequestStatus;

class ReturnRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ma_phieu_muon' => ['required', 'integer', 'exists:phieu_muon_may,id'],
            'thoi_gian_tra' => ['required', 'date'],
            'so_luong' => ['required', 'integer', 'min:1'],
            'ghi_chu' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $loanRequest = LoanRequest::find($this->input('ma_phieu_muon'));
            if (!$loanRequest) return;

            if (!$loanRequest->details()->exists()) {
                $validator->errors()->add('ma_phieu_muon', 'Chỉ có thể tạo phiếu trả cho phiếu mượn đã được cấp máy.');
                return;
            }
            $remaining = $loanRequest->so_luong_con_lai;

            if ($this->input('so_luong') > $remaining) {
                $validator->errors()->add('so_luong', "Số lượng trả vượt quá số máy chưa trả hoặc đang chờ duyệt ({$remaining} máy).");
            }
        });
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
