<?php

namespace App\Http\Requests;

use App\Enums\IncidentReportStatus;
use App\Models\IncidentReport;
use App\Models\User;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * Validate dữ liệu tạo phiếu bảo trì.
 * Kiểm tra báo cáo sự cố phải đang ở trạng thái confirmed,
 * và người phụ trách phải là giảng viên (vai_tro.ten_vai_tro = 'teacher').
 */
class MaintenanceTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ma_bao_cao_su_co'  => 'required|integer|exists:bao_cao_su_co,id',
            'ma_nguoi_phu_trach' => 'required|integer|exists:nguoi_dung,id',
            'loai_bao_tri'      => 'nullable|string|max:255',
            'ngay_bat_dau'      => 'nullable|date',
            'ngay_ket_thuc'     => 'nullable|date|after_or_equal:ngay_bat_dau',
            'cach_xu_ly'        => 'nullable|string',
            'chi_phi'           => 'nullable|numeric|min:0',
        ];
    }

    /**
     * Validate bổ sung:
     * 1. Báo cáo sự cố phải đang ở trạng thái confirmed.
     * 2. Người phụ trách phải là giảng viên (role teacher).
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            // Kiểm tra trạng thái báo cáo sự cố phải là confirmed
            $report = IncidentReport::find($this->input('ma_bao_cao_su_co'));
            if ($report && $report->trang_thai !== IncidentReportStatus::CONFIRMED) {
                $validator->errors()->add(
                    'ma_bao_cao_su_co',
                    'Chỉ được lập phiếu bảo trì cho báo cáo đã tiếp nhận (confirmed).'
                );
            }

            // Kiểm tra người phụ trách phải có vai trò kỹ thuật viên
            $assignee = User::with('role')->find($this->input('ma_nguoi_phu_trach'));
            if ($assignee && $assignee->role && $assignee->role->ten_vai_tro !== 'technician') {
                $validator->errors()->add(
                    'ma_nguoi_phu_trach',
                    'Người phụ trách phải là kỹ thuật viên.'
                );
            }
        });
    }

    public function messages(): array
    {
        return [
            'ma_bao_cao_su_co.required'   => 'Vui lòng chọn báo cáo sự cố.',
            'ma_bao_cao_su_co.exists'     => 'Báo cáo sự cố không tồn tại.',
            'ma_nguoi_phu_trach.required' => 'Vui lòng chọn người phụ trách.',
            'ma_nguoi_phu_trach.exists'   => 'Người phụ trách không tồn tại trong hệ thống.',
            'ngay_ket_thuc.after_or_equal' => 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.',
            'chi_phi.numeric'              => 'Chi phí phải là số.',
            'chi_phi.min'                  => 'Chi phí không được âm.',
        ];
    }

    /**
     * Khi validate thất bại, trả response JSON theo chuẩn project.
     */
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'status'     => false,
            'message'    => 'Dữ liệu phiếu bảo trì không hợp lệ',
            'error_code' => 422,
            'data'       => $validator->errors(),
        ], 422));
    }
}
