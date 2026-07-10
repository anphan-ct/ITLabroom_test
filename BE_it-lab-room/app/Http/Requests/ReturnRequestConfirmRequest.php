<?php

namespace App\Http\Requests;

use App\Models\ReturnRequest;
use App\Models\LoanRequestDetail;
use App\Enums\ReturnRequestStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class ReturnRequestConfirmRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'action' => ['required', 'in:confirm'],
            'machine_conditions' => ['array', 'required'],
            'machine_conditions.*.ma_may_tinh' => ['required', 'integer', 'exists:may_tinh,id'],
            'machine_conditions.*.tinh_trang_khi_tra' => ['required', 'string', 'in:active,broken,maintenance'],
            'machine_conditions.*.ghi_chu' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $returnRequest = $this->route('returnRequest');
            if (!$returnRequest) return;

            if ($returnRequest->trang_thai === ReturnRequestStatus::CONFIRMED->value) {
                $validator->errors()->add('returnRequest', 'Phiếu trả này đã được xác nhận.');
                return;
            }

            $conditions = $this->input('machine_conditions', []);
            if (count($conditions) !== $returnRequest->so_luong) {
                $validator->errors()->add('machine_conditions', "Số lượng máy nhập tình trạng (" . count($conditions) . ") không khớp với yêu cầu trả ({$returnRequest->so_luong}).");
            }

            $providedComputerIds = array_column($conditions, 'ma_may_tinh');
            if (count($providedComputerIds) !== count(array_unique($providedComputerIds))) {
                $validator->errors()->add('machine_conditions', 'Danh sách máy trả không được trùng lặp.');
                return;
            }

            // Kiểm tra mỗi máy có nằm trong phiếu mượn gốc và chưa được trả không.
            $loanRequestId = $returnRequest->ma_phieu_muon;
            $borrowedComputerIds = LoanRequestDetail::where('ma_phieu_muon', $loanRequestId)
                ->where('trang_thai_tra', '!=', 'Đã trả')
                ->pluck('ma_may_tinh')
                ->toArray();

            foreach ($providedComputerIds as $id) {
                if (!in_array($id, $borrowedComputerIds)) {
                    $validator->errors()->add('machine_conditions', "Máy tính ID {$id} không nằm trong phiếu mượn gốc hoặc đã được trả.");
                }
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
