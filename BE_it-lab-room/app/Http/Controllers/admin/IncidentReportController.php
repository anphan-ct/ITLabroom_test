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

            // Ánh xạ action sang trạng thái mới
            $newStatus = match ($action) {
                'confirm' => IncidentReportStatus::CONFIRMED,
                'reject'  => IncidentReportStatus::REJECTED,
            };

            $incidentReport->update(['trang_thai' => $newStatus]);

            // Điểm 2: Khi tiếp nhận (confirm) → đồng bộ máy/thiết bị sang bảo trì
            if ($action === 'confirm') {
                if ($incidentReport->ma_may_tinh) {
                    Computer::where('id', $incidentReport->ma_may_tinh)
                        ->where('trang_thai', 'active')
                        ->update(['trang_thai' => 'maintenance']);
                }
                if ($incidentReport->ma_thiet_bi) {
                    Equipment::where('id', $incidentReport->ma_thiet_bi)
                        ->where('trang_thai', 'active')
                        ->update(['trang_thai' => 'maintenance']);
                }
            }

            // Reload quan hệ để trả resource đầy đủ
            $incidentReport->load([
                'reporter:id,ho_ten',
                'computer:id,ma_may,ten_may,ma_phong',
                'computer.room:id,ma_phong,ten_phong',
                'equipment:id,ten_thiet_bi,ma_phong',
                'equipment.room:id,ma_phong,ten_phong',
            ]);

            $actionLabel = $action === 'confirm' ? 'tiếp nhận' : 'từ chối';

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
