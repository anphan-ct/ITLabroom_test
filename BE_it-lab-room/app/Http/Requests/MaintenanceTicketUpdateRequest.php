<?php

namespace App\Http\Requests;

use App\Enums\MaintenanceTicketStatus;
use App\Enums\MaintenanceType;
use App\Models\User;
use Illuminate\Validation\Rule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * Validate dữ liệu cập nhật phiếu bảo trì.
 * Chỉ cho sửa phiếu đang pending hoặc in_progress.
 * KHÔNG cho sửa ma_bao_cao_su_co (báo cáo sự cố gốc).
 */
class MaintenanceTicketUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ma_nguoi_phu_trach' => 'required|integer|exists:nguoi_dung,id',
            'loai_bao_tri'       => ['nullable', 'string', Rule::in(MaintenanceType::all())],
            'ngay_bat_dau'       => 'nullable|date',
            'ngay_ket_thuc'      => 'nullable|date|after_or_equal:ngay_bat_dau',
            'cach_xu_ly'         => 'nullable|string',
            'chi_phi'            => 'nullable|numeric|min:0',
            'trang_thai'         => ['required', 'string', Rule::in(MaintenanceTicketStatus::all())],
        ];
    }

    /**
     * Validate bổ sung:
     * 1. Phiếu phải đang ở trạng thái pending hoặc in_progress.
     * 2. Người phụ trách phải là kỹ thuật viên (role technician).
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            // Kiểm tra trạng thái phiếu: chỉ cho sửa khi chưa đóng
            $ticket = $this->route('maintenanceTicket');
            if ($ticket && $ticket->trang_thai === MaintenanceTicketStatus::COMPLETED) {
                $validator->errors()->add(
                    'trang_thai',
                    'Phiếu bảo trì đã đóng (hoàn thành), không thể chỉnh sửa.'
                );
                return;
            }

            // Không cho phép chuyển ngược trạng thái từ in_progress về pending
            $newStatus = $this->input('trang_thai');
            if ($ticket && $ticket->trang_thai === MaintenanceTicketStatus::IN_PROGRESS && $newStatus === MaintenanceTicketStatus::PENDING) {
                $validator->errors()->add(
                    'trang_thai',
                    'Không thể chuyển trạng thái từ đang xử lý về chưa xử lý.'
                );
            }

            // Bắt buộc nhập cách xử lý khi hoàn thành
            if ($newStatus === MaintenanceTicketStatus::COMPLETED && empty($this->input('cach_xu_ly'))) {
                $validator->errors()->add(
                    'cach_xu_ly',
                    'Vui lòng nhập cách xử lý khi hoàn thành phiếu bảo trì.'
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
            'ma_nguoi_phu_trach.required'  => 'Vui lòng chọn người phụ trách.',
            'ma_nguoi_phu_trach.exists'    => 'Người phụ trách không tồn tại trong hệ thống.',
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
            'message'    => 'Dữ liệu cập nhật phiếu bảo trì không hợp lệ',
            'error_code' => 422,
            'data'       => $validator->errors(),
        ], 422));
    }
}
