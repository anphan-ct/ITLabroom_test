<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\MaintenanceTicketRequest;
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
     * Tạo phiếu bảo trì mới từ báo cáo sự cố đã tiếp nhận.
     * Trong transaction: tạo phiếu + cập nhật báo cáo sang processing.
     */
    public function store(MaintenanceTicketRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();

            $ticket = DB::transaction(function () use ($data) {
                // Khoá báo cáo sự cố để tránh race condition tạo trùng phiếu (Điểm 3)
                $report = IncidentReport::where('id', $data['ma_bao_cao_su_co'])
                    ->lockForUpdate()
                    ->first();

                // Kiểm tra đã có phiếu bảo trì chưa đóng cho báo cáo này chưa
                $existingTicket = MaintenanceTicket::where('ma_bao_cao_su_co', $data['ma_bao_cao_su_co'])
                    ->whereIn('trang_thai', [
                        MaintenanceTicketStatus::PENDING,
                        MaintenanceTicketStatus::IN_PROGRESS,
                    ])->exists();

                if ($existingTicket) {
                    throw new \Illuminate\Http\Exceptions\HttpResponseException(response()->json([
                        'status'     => false,
                        'message'    => 'Báo cáo sự cố này đã có phiếu bảo trì đang xử lý, không thể tạo thêm',
                        'error_code' => 422,
                        'data'       => ['ma_bao_cao_su_co' => ['Đã tồn tại phiếu bảo trì đang xử lý cho báo cáo này.']],
                    ], 422));
                }

                // Tạo phiếu bảo trì
                $ticket = MaintenanceTicket::create([
                    'ma_bao_cao_su_co'   => $data['ma_bao_cao_su_co'],
                    'ma_nguoi_phu_trach' => $data['ma_nguoi_phu_trach'],
                    'loai_bao_tri'       => $data['loai_bao_tri'] ?? null,
                    'ngay_bat_dau'       => $data['ngay_bat_dau'] ?? null,
                    'ngay_ket_thuc'      => $data['ngay_ket_thuc'] ?? null,
                    'cach_xu_ly'         => $data['cach_xu_ly'] ?? null,
                    'chi_phi'            => $data['chi_phi'] ?? 0,
                    'trang_thai'         => 'pending',
                ]);

                // Cập nhật trạng thái báo cáo sự cố sang processing
                $report->update(['trang_thai' => IncidentReportStatus::PROCESSING]);

                // Điểm 2: Đồng bộ máy/thiết bị sang maintenance (chỉ khi đang active)
                if ($report->ma_may_tinh) {
                    Computer::where('id', $report->ma_may_tinh)
                        ->where('trang_thai', 'active')
                        ->update(['trang_thai' => 'maintenance']);
                }
                if ($report->ma_thiet_bi) {
                    Equipment::where('id', $report->ma_thiet_bi)
                        ->where('trang_thai', 'active')
                        ->update(['trang_thai' => 'maintenance']);
                }

                return $ticket;
            });

            // Load quan hệ để trả resource đầy đủ
            $ticket->load([
                'incidentReport:id,tieu_de,trang_thai,ma_may_tinh,ma_thiet_bi',
                'assignee:id,ho_ten',
            ]);

            return response()->json([
                'status'     => true,
                'message'    => 'Tạo phiếu bảo trì thành công',
                'error_code' => 201,
                'data'       => new MaintenanceTicketResource($ticket),
            ], 201);
        } catch (Throwable $e) {
            Log::error('Admin\MaintenanceTicketController@store: ' . $e->getMessage());
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
            $maintenanceTicket->update($request->validated());

            // Load quan hệ để trả resource đầy đủ
            $maintenanceTicket->load([
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
