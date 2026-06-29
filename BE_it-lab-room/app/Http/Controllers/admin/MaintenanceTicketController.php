<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\MaintenanceTicketRequest;
use App\Http\Resources\MaintenanceTicketResource;
use App\Enums\IncidentReportStatus;
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
                    'incidentReport:id,tieu_de,trang_thai',
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
                IncidentReport::where('id', $data['ma_bao_cao_su_co'])
                    ->update(['trang_thai' => IncidentReportStatus::PROCESSING]);

                return $ticket;
            });

            // Load quan hệ để trả resource đầy đủ
            $ticket->load([
                'incidentReport:id,tieu_de,trang_thai',
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
}
