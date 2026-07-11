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
