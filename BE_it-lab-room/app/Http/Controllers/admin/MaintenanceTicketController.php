<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\MaintenanceTicketUpdateRequest;
use App\Http\Resources\MaintenanceTicketResource;
use App\Enums\IncidentReportStatus;
use App\Enums\MaintenanceTicketStatus;
use App\Models\Computer;
use App\Models\Equipment;
use App\Models\IncidentReport;
use App\Models\MaintenanceTicket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\NotificationService;
use App\Models\Notification;
use Throwable;

class MaintenanceTicketController extends Controller
{
    /**
     * Lấy danh sách phiếu bảo trì, hỗ trợ tìm kiếm, lọc trạng thái và phân trang.
     * Eager load incidentReport, assignee để tránh N+1.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = MaintenanceTicket::query()
                ->with([
                    'incidentReport:id,tieu_de,trang_thai,ma_may_tinh,ma_thiet_bi',
                    'assignee:id,ho_ten',
                ]);

            // Tìm kiếm theo loại bảo trì hoặc tiêu đề báo cáo
            if ($request->filled('search')) {
                $keyword = trim($request->input('search'));
                $query->where(function ($q) use ($keyword) {
                    $q->where('loai_bao_tri', 'LIKE', "%{$keyword}%")
                        ->orWhereHas('incidentReport', function ($rq) use ($keyword) {
                            $rq->where('tieu_de', 'LIKE', "%{$keyword}%");
                        });
                });
            }

            // Lọc theo trạng thái
            if ($request->filled('status')) {
                $query->where('trang_thai', $request->input('status'));
            }

            // Sắp xếp mới nhất trước, phân trang 15 bản ghi
            $tickets = $query->orderByDesc('id')->paginate(15);

            return response()->json([
                'status'     => true,
                'message'    => 'Lấy danh sách phiếu bảo trì thành công',
                'error_code' => 200,
                'data'       => MaintenanceTicketResource::collection($tickets),
                'pagination' => [
                    'current_page' => $tickets->currentPage(),
                    'last_page'    => $tickets->lastPage(),
                    'per_page'     => $tickets->perPage(),
                    'total'        => $tickets->total(),
                ],
            ], 200);
        } catch (Throwable $e) {
            Log::error('Admin\MaintenanceTicketController@index: ' . $e->getMessage());
            return response()->json([
                'status'     => false,
                'message'    => 'Hiện tại không thể xử lý yêu cầu của bạn',
                'error_code' => 500,
                'data'       => '',
            ], 500);
        }
    }


    /**
     * Cập nhật phiếu bảo trì (đang pending/in_progress).
     * Không cho sửa ma_bao_cao_su_co (báo cáo sự cố gốc).
     */
    public function update(MaintenanceTicketUpdateRequest $request, MaintenanceTicket $maintenanceTicket): JsonResponse
    {
        try {
            DB::transaction(function () use ($request, $maintenanceTicket) {
                $maintenanceTicket->update($request->validated());

                // Nếu trạng thái phiếu chuyển sang COMPLETED
                if ($maintenanceTicket->wasChanged('trang_thai') && $maintenanceTicket->trang_thai === MaintenanceTicketStatus::COMPLETED) {
                    $incidentReport = IncidentReport::where('id', $maintenanceTicket->ma_bao_cao_su_co)->first();
                    
                    if ($incidentReport) {
                        // Cập nhật báo cáo sự cố sang RESOLVED
                        $incidentReport->update(['trang_thai' => IncidentReportStatus::RESOLVED]);

                        // Tự động sinh RepairLog
                        \App\Models\RepairLog::create([
                            'ma_phieu_bao_tri' => $maintenanceTicket->id,
                            'ma_may_tinh'      => $incidentReport->ma_may_tinh,
                            'ma_thiet_bi'      => $incidentReport->ma_thiet_bi,
                            'ma_nguoi_sua'     => $maintenanceTicket->ma_nguoi_phu_trach,
                            'thoi_gian_sua'    => $maintenanceTicket->updated_at,
                            'noi_dung_sua'     => $maintenanceTicket->cach_xu_ly,
                            'ket_qua'          => \App\Enums\RepairResult::DA_XU_LY,
                            'chi_phi'          => $maintenanceTicket->chi_phi,
                        ]);

                        // Cập nhật trạng thái máy tính/thiết bị sang active
                        if ($incidentReport->ma_may_tinh) {
                            Computer::where('id', $incidentReport->ma_may_tinh)
                                ->where('trang_thai', 'maintenance')
                                ->update(['trang_thai' => 'active']);
                        }
                        if ($incidentReport->ma_thiet_bi) {
                            Equipment::where('id', $incidentReport->ma_thiet_bi)
                                ->where('trang_thai', 'maintenance')
                                ->update(['trang_thai' => 'active']);
                        }

                        NotificationService::notifyUser(
                            $incidentReport->ma_nguoi_bao_cao,
                            "Sự cố đã khắc phục",
                            "Báo cáo '{$incidentReport->tieu_de}' của bạn đã được khắc phục xong",
                            Notification::SU_CO_DA_KHAC_PHUC
                        );
                    }
                }
            });

            // Load quan hệ để trả resource đầy đủ
            $maintenanceTicket->refresh()->load([
                'incidentReport:id,tieu_de,trang_thai,ma_may_tinh,ma_thiet_bi',
                'assignee:id,ho_ten',
            ]);

            return response()->json([
                'status'     => true,
                'message'    => 'Cập nhật phiếu bảo trì thành công',
                'error_code' => 200,
                'data'       => new MaintenanceTicketResource($maintenanceTicket),
            ], 200);
        } catch (Throwable $e) {
            Log::error('Admin\MaintenanceTicketController@update: ' . $e->getMessage());
            return response()->json([
                'status'     => false,
                'message'    => 'Hiện tại không thể xử lý yêu cầu của bạn',
                'error_code' => 500,
                'data'       => '',
            ], 500);
        }
    }
}
