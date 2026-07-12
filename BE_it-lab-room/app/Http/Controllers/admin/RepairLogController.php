<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
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
                    'computer:id,ma_may,ten_may,ma_phong',
                    'computer.room:id,ma_phong,ten_phong',
                    'equipment:id,ten_thiet_bi,ma_phong',
                    'equipment.room:id,ma_phong,ten_phong',
                    'repairer:id,ho_ten',
                ]);

            // Lọc theo phiếu bảo trì cụ thể
            if ($request->filled('ma_phieu_bao_tri')) {
                $query->where('ma_phieu_bao_tri', (int) $request->input('ma_phieu_bao_tri'));
            }

            // Lọc nhật ký sửa chữa theo máy tính khi mở trang chi tiết máy.
            if ($request->filled('ma_may_tinh')) {
                $query->where('ma_may_tinh', (int) $request->input('ma_may_tinh'));
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


}
