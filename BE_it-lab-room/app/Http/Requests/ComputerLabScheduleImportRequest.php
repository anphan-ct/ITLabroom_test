<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class ComputerLabScheduleImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'schedules' => ['required', 'array', 'min:1', 'max:500'],
            'schedules.*' => ['required', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'schedules.required' => 'Vui lòng chọn file CSV lịch phòng máy.',
            'schedules.array' => 'Dữ liệu CSV lịch phòng máy không hợp lệ.',
            'schedules.min' => 'File CSV không có dữ liệu để nhập.',
            'schedules.max' => 'Mỗi lần chỉ được nhập tối đa 500 dòng lịch.',
            'schedules.*.array' => 'Dòng lịch trong file CSV không hợp lệ.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'status' => false,
            'message' => 'Dữ liệu nhập lịch phòng máy không hợp lệ',
            'error_code' => 422,
            'data' => $validator->errors(),
        ], 422));
    }
}
