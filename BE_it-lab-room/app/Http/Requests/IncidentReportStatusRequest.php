<?php

namespace App\Http\Requests;

use App\Enums\IncidentReportStatus;
use App\Models\IncidentReport;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * Validate hành động đổi trạng thái báo cáo sự cố (admin).
 * Chặn state machine: confirm chỉ từ open, reject chỉ từ open|confirmed.
 */
class IncidentReportStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'action' => 'required|string|in:confirm,reject',
        ];
    }

    /**
     * Validate state machine: kiểm tra trạng thái hiện tại có cho phép hành động không.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            // Lấy báo cáo từ route model binding
            $incidentReport = $this->route('incidentReport');
            if (!$incidentReport) {
                $validator->errors()->add('incidentReport', 'Báo cáo sự cố không tồn tại.');
                return;
            }

            $action = $this->input('action');
            $currentStatus = $incidentReport->trang_thai;

            // Kiểm tra hành động có hợp lệ với trạng thái hiện tại
            if (!IncidentReportStatus::canPerformAction($currentStatus, $action)) {
                $actionLabel = $action === 'confirm' ? 'tiếp nhận' : 'từ chối';
                $validator->errors()->add(
                    'action',
                    "Không thể {$actionLabel} báo cáo đang ở trạng thái \"{$currentStatus}\"."
                );
            }
        });
    }

    public function messages(): array
    {
        return [
            'action.required' => 'Vui lòng chọn hành động.',
            'action.in'       => 'Hành động không hợp lệ. Chỉ chấp nhận: confirm, reject.',
        ];
    }


    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'status'     => false,
            'message'    => 'Hành động không hợp lệ',
            'error_code' => 422,
            'data'       => $validator->errors(),
        ], 422));
    }
}
