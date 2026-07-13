<?php

namespace App\Http\Requests;

use App\Models\Computer;
use App\Enums\ComputerStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class LoanRequestApprovalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'action' => ['required', 'in:approve,reject'],
            'computer_ids' => ['array', 'required_if:action,approve'],
            'computer_ids.*' => ['integer', 'exists:may_tinh,id'],
            'machine_conditions' => ['array'],
            'machine_conditions.*.tinh_trang_khi_muon' => ['required_with:machine_conditions', 'string', 'in:active,broken,maintenance'],
            'machine_conditions.*.ghi_chu' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $loanRequest = $this->route('loanRequest');
            if (!$loanRequest) return;

            if ($loanRequest->details()->exists()) {
                $validator->errors()->add('loanRequest', 'Phiếu mượn này đã được cấp máy.');
                return;
            }

            if ($this->input('action') === 'approve') {
                $computerIds = $this->input('computer_ids', []);
                if (count($computerIds) !== $loanRequest->so_luong) {
                    $validator->errors()->add('computer_ids', "Số lượng máy chọn (" . count($computerIds) . ") không khớp với yêu cầu ({$loanRequest->so_luong}).");
                }

                $activeComputersCount = Computer::whereIn('id', $computerIds)
                    ->where('trang_thai', ComputerStatus::ACTIVE->value)
                    ->count();

                if ($activeComputersCount !== count($computerIds)) {
                    $validator->errors()->add('computer_ids', 'Một hoặc nhiều máy tính được chọn không ở trạng thái hoạt động.');
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
