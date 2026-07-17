<?php

namespace App\Http\Controllers\common;

use App\Http\Controllers\Controller;
use App\Http\Requests\IncidentReportRequest;
use App\Http\Resources\IncidentReportResource;
use App\Enums\IncidentReportStatus;
use App\Models\IncidentReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\NotificationService;
use App\Models\Notification;
use Throwable;

/**
 * Controller chung cho student/teacher — báo cáo sự cố.
 * Mỗi người chỉ xem/tạo báo cáo CỦA CHÍNH MÌNH.
 */
class IncidentReportController extends Controller
{
    /**
     * Lấy danh sách báo cáo sự cố của chính người đăng nhập.
     * Hỗ trợ phân trang.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $reports = IncidentReport::query()
                ->where('ma_nguoi_bao_cao', Auth::id())
                ->with([
                    'reporter:id,ho_ten',
                    'computer:id,ma_may,ten_may,ma_phong',
                    'computer.room:id,ma_phong,ten_phong',
                    'equipment:id,ten_thiet_bi,ma_phong',
                    'equipment.room:id,ma_phong,ten_phong',
                ])
                ->orderByDesc('id')
                ->paginate(15);

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
            Log::error('Common\IncidentReportController@index: ' . $e->getMessage());
            return response()->json([
                'status'     => false,
                'message'    => 'Hiện tại không thể xử lý yêu cầu của bạn',
                'error_code' => 500,
                'data'       => '',
            ], 500);
        }
    }

    /**
     * Tạo báo cáo sự cố mới.
     * ma_nguoi_bao_cao lấy từ Auth::id(), trang_thai mặc định 'open'.
     */
    public function store(IncidentReportRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();

            $report = DB::transaction(function () use ($data) {
                $createdReport = IncidentReport::create([
                    'ma_nguoi_bao_cao' => Auth::id(),
                    'ma_may_tinh'      => $data['ma_may_tinh'] ?? null,
                    'ma_thiet_bi'      => $data['ma_thiet_bi'] ?? null,
                    'loai_su_co'       => $data['loai_su_co'],
                    'tieu_de'          => $data['tieu_de'],
                    'mo_ta'            => $data['mo_ta'] ?? null,
                    'muc_do'           => $data['muc_do'],
                    'trang_thai'       => IncidentReportStatus::OPEN,
                ]);

                $user = Auth::user();
                $reporterName = $user ? $user->ho_ten : 'Người dùng';

                NotificationService::notifyRole(
                    'admin',
                    'Báo cáo sự cố mới',
                    "{$reporterName} vừa gửi báo cáo lỗi: {$createdReport->tieu_de}",
                    Notification::SU_CO_MOI
                );

                return $createdReport;
            });

            // Load quan hệ để trả resource đầy đủ
            $report->load([
                'reporter:id,ho_ten',
                'computer:id,ma_may,ten_may,ma_phong',
                'computer.room:id,ma_phong,ten_phong',
                'equipment:id,ten_thiet_bi,ma_phong',
                'equipment.room:id,ma_phong,ten_phong',
            ]);

            return response()->json([
                'status'     => true,
                'message'    => 'Tạo báo cáo sự cố thành công',
                'error_code' => 201,
                'data'       => new IncidentReportResource($report),
            ], 201);
        } catch (Throwable $e) {
            Log::error('Common\IncidentReportController@store: ' . $e->getMessage());
            return response()->json([
                'status'     => false,
                'message'    => 'Hiện tại không thể xử lý yêu cầu của bạn',
                'error_code' => 500,
                'data'       => '',
            ], 500);
        }
    }
}
