<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class LoanRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ngay_muon' => ['required', 'date'],    
            'so_luong' => ['required', 'integer', 'min:1'],
            'ly_do_muon' => ['nullable', 'string', 'max:1000'],
            'nguoi_muon' => ['required', 'string', 'max:255'],
            'ma_phong_ban' => ['required', 'integer', 'exists:phong_ban,id'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $loanRequest = $this->route('loanRequest');
            if (!$loanRequest) return;

            $ngayMuonMoi = $this->input('ngay_muon');
            if (!$ngayMuonMoi) return;

            $earliestReturn = $loanRequest->returnRequests()->min('thoi_gian_tra');
            if ($earliestReturn && \Carbon\Carbon::parse($ngayMuonMoi)->gt(\Carbon\Carbon::parse($earliestReturn))) {
                $validator->errors()->add(
                    'ngay_muon',
                    'Ngày mượn không được muộn hơn ngày trả đã ghi nhận (' . \Carbon\Carbon::parse($earliestReturn)->format('d/m/Y H:i') . ').'
                );
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
