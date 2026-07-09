<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\IncidentReportStatusRequest;
use App\Http\Resources\IncidentReportResource;
use App\Enums\IncidentReportStatus;
use App\Models\Computer;
use App\Models\Equipment;
use App\Models\IncidentReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class IncidentReportController extends Controller
{
    /**
     * Lấy danh sách báo cáo sự cố, hỗ trợ tìm kiếm, lọc trạng thái, mức độ và phân trang.
     * Eager load reporter, computer.room, equipment.room để tránh N+1.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = IncidentReport::query()
                ->with([
                    'reporter:id,ho_ten',
                    'computer:id,ma_may,ten_may,ma_phong',
                    'computer.room:id,ma_phong,ten_phong',
                    'equipment:id,ten_thiet_bi,ma_phong',
                    'equipment.room:id,ma_phong,ten_phong',
                ]);

            // Tìm kiếm theo tiêu đề hoặc tên người báo cáo
            if ($request->filled('search')) {
                $keyword = trim($request->input('search'));
                $query->where(function ($q) use ($keyword) {
                    $q->where('tieu_de', 'LIKE', "%{$keyword}%")
                        ->orWhereHas('reporter', function ($rq) use ($keyword) {
                            $rq->where('ho_ten', 'LIKE', "%{$keyword}%");
                        });
                });
            }

            // Lọc theo trạng thái
            if ($request->filled('status')) {
                $query->where('trang_thai', $request->input('status'));
            }

            // Lọc theo mức độ
            if ($request->filled('severity')) {
                $query->where('muc_do', $request->input('severity'));
            }

            // Sắp xếp mới nhất trước, phân trang 15 bản ghi
            $reports = $query->orderByDesc('id')->paginate(15);

            return response()->json([
                'status'     => true,
                'message'    => 'Lấy danh sách báo cáo sự cố thành công',
                'error_code' => 200,
                'data'       => IncidentReportResource::collection($reports),
                'pagination' => [
                    'current_page' => $reports->currentPage(),
                    'last_page'    => $reports->lastPage(),
                    'per_page'     => $reports->perPage(),
                    'total'        => $reports->total(),
                ],
            ], 200);
        } catch (Throwable $e) {
            Log::error('Admin\IncidentReportController@index: ' . $e->getMessage());
            return response()->json([
                'status'     => false,
                'message'    => 'Hiện tại không thể xử lý yêu cầu của bạn',
                'error_code' => 500,
                'data'       => '',
            ], 500);
        }
    }

    /**
     * Cập nhật trạng thái báo cáo sự cố (tiếp nhận/từ chối).
     * State machine đã được validate trong IncidentReportStatusRequest.
     */
    public function updateStatus(IncidentReportStatusRequest $request, IncidentReport $incidentReport): JsonResponse
    {
        try {
            $action = $request->validated()['action'];
            $actionLabel = $action === 'confirm' ? 'tiếp nhận' : 'từ chối';

            \Illuminate\Support\Facades\DB::transaction(function () use ($action, $incidentReport) {
                // Khóa row để tránh race condition
                $lockedReport = IncidentReport::where('id', $incidentReport->id)->lockForUpdate()->first();

                // Ánh xạ action sang trạng thái mới
                $newStatus = match ($action) {
                    'confirm' => IncidentReportStatus::PROCESSING,
                    'reject'  => IncidentReportStatus::REJECTED,
                };

                $lockedReport->update(['trang_thai' => $newStatus]);

                // Khi tiếp nhận (confirm) → đồng bộ máy/thiết bị sang bảo trì và tạo phiếu bảo trì
                if ($action === 'confirm') {
                    if ($lockedReport->ma_may_tinh) {
                        Computer::where('id', $lockedReport->ma_may_tinh)
                            ->where('trang_thai', 'active')
                            ->update(['trang_thai' => 'maintenance']);
                    }
                    if ($lockedReport->ma_thiet_bi) {
                        Equipment::where('id', $lockedReport->ma_thiet_bi)
                            ->where('trang_thai', 'active')
                            ->update(['trang_thai' => 'maintenance']);
                    }

                    // Tự động tạo phiếu bảo trì nếu chưa có
                    $existingTicket = \App\Models\MaintenanceTicket::where('ma_bao_cao_su_co', $lockedReport->id)->first();
                    if (!$existingTicket) {
                        \App\Models\MaintenanceTicket::create([
                            'ma_bao_cao_su_co' => $lockedReport->id,
                            'trang_thai' => \App\Enums\MaintenanceTicketStatus::PENDING,
                        ]);
                    }
                }
            });

            // Reload quan hệ để trả resource đầy đủ
            $incidentReport->refresh()->load([
                'reporter:id,ho_ten',
                'computer:id,ma_may,ten_may,ma_phong',
                'computer.room:id,ma_phong,ten_phong',
                'equipment:id,ten_thiet_bi,ma_phong',
                'equipment.room:id,ma_phong,ten_phong',
            ]);

            return response()->json([
                'status'     => true,
                'message'    => "Đã {$actionLabel} báo cáo sự cố thành công",
                'error_code' => 200,
                'data'       => new IncidentReportResource($incidentReport),
            ], 200);
        } catch (Throwable $e) {
            Log::error('Admin\IncidentReportController@updateStatus: ' . $e->getMessage());
            return response()->json([
                'status'     => false,
                'message'    => 'Hiện tại không thể xử lý yêu cầu của bạn',
                'error_code' => 500,
                'data'       => '',
            ], 500);
        }
    }
}
