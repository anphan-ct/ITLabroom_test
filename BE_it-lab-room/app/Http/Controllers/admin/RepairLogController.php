<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\RepairLogRequest;
use App\Http\Resources\RepairLogResource;
use App\Enums\IncidentReportStatus;
use App\Enums\MaintenanceTicketStatus;
use App\Enums\RepairResult;
use App\Models\Computer;
use App\Models\Equipment;
use App\Models\MaintenanceTicket;
use App\Models\RepairLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class RepairLogController extends Controller
{
    /**
     * Lấy danh sách nhật ký sửa chữa, hỗ trợ lọc theo phiếu bảo trì, tìm kiếm và phân trang.
     * Eager load maintenanceTicket, computer, equipment, repairer để tránh N+1.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = RepairLog::query()
                ->with([
                    'maintenanceTicket:id,trang_thai',
                    'computer:id,ma_may,ten_may',
                    'equipment:id,ten_thiet_bi',
                    'repairer:id,ho_ten',
                ]);

            // Lọc theo phiếu bảo trì cụ thể
            if ($request->filled('ma_phieu_bao_tri')) {
                $query->where('ma_phieu_bao_tri', (int) $request->input('ma_phieu_bao_tri'));
            }

            // Tìm kiếm theo nội dung sửa
            if ($request->filled('search')) {
                $keyword = trim($request->input('search'));
                $query->where('noi_dung_sua', 'LIKE', "%{$keyword}%");
            }

            // Sắp xếp mới nhất trước, phân trang 15 bản ghi
            $logs = $query->orderByDesc('id')->paginate(15);

            return response()->json([
                'status'     => true,
                'message'    => 'Lấy danh sách nhật ký sửa chữa thành công',
                'error_code' => 200,
                'data'       => RepairLogResource::collection($logs),
                'pagination' => [
                    'current_page' => $logs->currentPage(),
                    'last_page'    => $logs->lastPage(),
                    'per_page'     => $logs->perPage(),
                    'total'        => $logs->total(),
                ],
            ], 200);
        } catch (Throwable $e) {
            Log::error('Admin\RepairLogController@index: ' . $e->getMessage());
            return response()->json([
                'status'     => false,
                'message'    => 'Hiện tại không thể xử lý yêu cầu của bạn',
                'error_code' => 500,
                'data'       => '',
            ], 500);
        }
    }

    /**
     * Tạo nhật ký sửa chữa mới.
     * Trong transaction:
     * 1. Tạo nhật ký.
     * 2. Nếu nhật ký đầu tiên của phiếu → phiếu chuyển in_progress.
     * 3. Nếu ket_qua = 'da_xu_ly' → cascade: phiếu completed, báo cáo resolved, máy/thiết bị hoạt động.
     */
    public function store(RepairLogRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();

            $repairLog = DB::transaction(function () use ($data) {
                // Tạo nhật ký sửa chữa
                $repairLog = RepairLog::create([
                    'ma_phieu_bao_tri' => $data['ma_phieu_bao_tri'],
                    'ma_may_tinh'      => $data['ma_may_tinh'] ?? null,
                    'ma_thiet_bi'      => $data['ma_thiet_bi'] ?? null,
                    'ma_nguoi_sua'     => Auth::id(),
                    'thoi_gian_sua'    => $data['thoi_gian_sua'],
                    'noi_dung_sua'     => $data['noi_dung_sua'],
                    'ket_qua'          => $data['ket_qua'],
                    'chi_phi'          => $data['chi_phi'] ?? 0,
                ]);

                // Lấy phiếu bảo trì liên quan (khoá row tránh race condition)
                $ticket = MaintenanceTicket::where('id', $data['ma_phieu_bao_tri'])
                    ->lockForUpdate()
                    ->first();

                // Nếu là nhật ký ĐẦU TIÊN của phiếu → chuyển phiếu sang in_progress
                if ($ticket->trang_thai === MaintenanceTicketStatus::PENDING) {
                    $ticket->update(['trang_thai' => MaintenanceTicketStatus::IN_PROGRESS]);
                }

                // Nếu kết quả là 'đã xử lý' → cascade cập nhật toàn bộ
                if ($data['ket_qua'] === RepairResult::DA_XU_LY) {
                    // Cập nhật phiếu bảo trì → completed
                    $ticket->update(['trang_thai' => MaintenanceTicketStatus::COMPLETED]);

                    // Cập nhật báo cáo sự cố → resolved
                    if ($ticket->ma_bao_cao_su_co) {
                        $ticket->incidentReport()->update([
                            'trang_thai' => IncidentReportStatus::RESOLVED,
                        ]);
                    }

                    // Cập nhật máy tính → hoạt động (nếu có)
                    if (!empty($data['ma_may_tinh'])) {
                        Computer::where('id', $data['ma_may_tinh'])
                            ->update(['trang_thai' => 'Hoạt động']);
                    }

                    // Cập nhật thiết bị → hoạt động (nếu có)
                    if (!empty($data['ma_thiet_bi'])) {
                        Equipment::where('id', $data['ma_thiet_bi'])
                            ->update(['trang_thai' => 'Sẵn sàng']);
                    }
                }

                return $repairLog;
            });

            // Load quan hệ để trả resource đầy đủ
            $repairLog->load([
                'maintenanceTicket:id,trang_thai',
                'computer:id,ma_may,ten_may',
                'equipment:id,ten_thiet_bi',
                'repairer:id,ho_ten',
            ]);

            return response()->json([
                'status'     => true,
                'message'    => 'Tạo nhật ký sửa chữa thành công',
                'error_code' => 201,
                'data'       => new RepairLogResource($repairLog),
            ], 201);
        } catch (Throwable $e) {
            Log::error('Admin\RepairLogController@store: ' . $e->getMessage());
            return response()->json([
                'status'     => false,
                'message'    => 'Hiện tại không thể xử lý yêu cầu của bạn',
                'error_code' => 500,
                'data'       => '',
            ], 500);
        }
    }
}
