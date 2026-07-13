<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Models\LoanRequest;
use App\Models\Computer;
use App\Models\LoanRequestDetail;
use App\Http\Requests\LoanRequestApprovalRequest;
use App\Enums\LoanRequestStatus;
use App\Enums\ComputerStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;
use App\Http\Resources\LoanRequestResource;
use App\Http\Requests\LoanRequestRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoanRequestController extends Controller
{
    public function index(Request $request)
    {
        try {
            $status = $request->query('trang_thai', 'all');

            $query = LoanRequest::with(['department', 'details.computer']);

            $notFullyReturned = function ($detailQuery) {
                $detailQuery->whereNotIn('ma_may_tinh', function ($sub) {
                    $sub->select('chi_tiet_phieu_tra_may.ma_may_tinh')
                        ->from('chi_tiet_phieu_tra_may')
                        ->join('phieu_tra_may', 'chi_tiet_phieu_tra_may.ma_phieu_tra', '=', 'phieu_tra_may.id')
                        ->whereColumn('phieu_tra_may.ma_phieu_muon', 'chi_tiet_phieu_muon_may.ma_phieu_muon')
                        ->where('phieu_tra_may.trang_thai', \App\Enums\ReturnRequestStatus::CONFIRMED->value);
                });
            };

            if ($status === 'chua_cap_may') {
                $query->whereDoesntHave('details');
            } elseif ($status === 'da_cap_may') {
                // Có details VÀ còn ít nhất 1 máy chưa trả
                $query->whereHas('details', $notFullyReturned);
            } elseif ($status === 'da_tra') {
                // Có details VÀ không còn máy nào chưa trả (tức tất cả đã trả)
                $query->whereHas('details')
                      ->whereDoesntHave('details', $notFullyReturned);
            }

            // Lọc lịch sử mượn theo máy tính khi xem từ trang chi tiết máy.
            if ($request->filled('ma_may_tinh')) {
                $query->whereHas('details', function ($detailQuery) use ($request) {
                    $detailQuery->where('ma_may_tinh', (int) $request->query('ma_may_tinh'));
                });
            }

            $perPage = min((int) $request->query('per_page', 15), 200);
            $requests = $query->orderBy('created_at', 'desc')->paginate($perPage);
            $requests->getCollection()->transform(function ($item) {
                return new LoanRequestResource($item);
            });

            return response()->json([
                'status' => true,
                'message' => 'Lấy danh sách phiếu mượn thành công',
                'error_code' => 0,
                'data' => LoanRequestResource::collection($requests),
                'pagination' => [
                    'current_page' => $requests->currentPage(),
                    'last_page'    => $requests->lastPage(),
                    'per_page'     => $requests->perPage(),
                    'total'        => $requests->total(),
                ]
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi hệ thống: ' . $e->getMessage(),
                'error_code' => 500,
                'data' => null
            ], 500);
        }
    }

    public function store(LoanRequestRequest $request)
    {
        try {
            $data = $request->validated();
            $data['ma_phieu_muon'] = $this->generateLoanCode();
            // Trạng thái giữ placeholder APPROVED hoặc PENDING vì getTrangThaiHienThiAttribute sẽ tính lại
            // Tuy nhiên trong CSDL vẫn cần giá trị hợp lệ với enum
            $data['trang_thai'] = LoanRequestStatus::APPROVED->value;

            $loanRequest = LoanRequest::create($data);

            return response()->json([
                'status' => true,
                'message' => 'Tạo phiếu mượn thành công',
                'error_code' => 0,
                'data' => $loanRequest
            ], 201);
        } catch (Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi hệ thống: ' . $e->getMessage(),
                'error_code' => 500,
                'data' => null
            ], 500);
        }
    }

    public function update(LoanRequestRequest $request, LoanRequest $loanRequest)
    {
        try {
            if ($loanRequest->details()->exists()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Phiếu mượn đã được cấp máy, không thể cập nhật.',
                    'error_code' => 400,
                    'data' => null
                ], 400);
            }

            $loanRequest->update($request->validated());

            return response()->json([
                'status' => true,
                'message' => 'Cập nhật phiếu mượn thành công',
                'error_code' => 0,
                'data' => new LoanRequestResource($loanRequest)
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi hệ thống: ' . $e->getMessage(),
                'error_code' => 500,
                'data' => null
            ], 500);
        }
    }

    private function generateLoanCode(): string
    {
        for ($attempt = 1; $attempt <= 50; $attempt++) {
            $code = 'PM-' . strtoupper(Str::random(6));
            if (! LoanRequest::where('ma_phieu_muon', $code)->exists()) {
                return $code;
            }
        }
        throw ValidationException::withMessages([
            'ma_phieu_muon' => ['Không thể tạo mã phiếu mượn, vui lòng thử lại.'],
        ]);
    }

    public function assignComputers(LoanRequestApprovalRequest $request, LoanRequest $loanRequest)
    {
        DB::beginTransaction();
        try {
            if ($loanRequest->details()->exists()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Phiếu mượn này đã được phân bổ máy.',
                    'error_code' => 400,
                    'data' => null
                ], 400);
            }
            $computerIds = $request->input('computer_ids');
            $conditions = $request->input('machine_conditions', []);
            $conditionMap = [];
            foreach ($conditions as $cond) {
                if (isset($cond['ma_may_tinh']) && isset($cond['tinh_trang_khi_muon'])) {
                    $conditionMap[$cond['ma_may_tinh']] = [
                        'tinh_trang_khi_muon' => $cond['tinh_trang_khi_muon'],
                        'ghi_chu' => $cond['ghi_chu'] ?? null
                    ];
                }
            }

            $computers = Computer::whereIn('id', $computerIds)->lockForUpdate()->get();
            if ($computers->count() !== $loanRequest->so_luong) {
                return response()->json([
                    'status' => false,
                    'message' => 'Số lượng máy được chọn (' . $computers->count() . ') không khớp với số lượng yêu cầu (' . $loanRequest->so_luong . ').',
                    'error_code' => 400,
                    'data' => null
                ], 400);
            }

            foreach ($computers as $computer) {
                if ($computer->trang_thai !== ComputerStatus::ACTIVE->value) {
                    throw new \Exception("Máy tính {$computer->ma_may} không ở trạng thái hoạt động.");
                }

                $computer->update(['trang_thai' => ComputerStatus::BORROWED->value]);

                $tinhTrang = $conditionMap[$computer->id]['tinh_trang_khi_muon'] ?? ComputerStatus::ACTIVE->value;
                $ghiChu = $conditionMap[$computer->id]['ghi_chu'] ?? null;

                LoanRequestDetail::create([
                    'ma_phieu_muon' => $loanRequest->id,
                    'ma_may_tinh' => $computer->id,
                    'tinh_trang_khi_muon' => $tinhTrang,
                    'ghi_chu' => $ghiChu,
                ]);
            }

            DB::commit();
            return response()->json([
                'status' => true,
                'message' => 'Đã duyệt phiếu mượn và phân bổ máy thành công',
                'error_code' => 0,
                'data' => $loanRequest->load('details.computer')
            ], 200);
        } catch (Throwable $e) {
            DB::rollBack();
            return response()->json([
                'status' => false,
                'message' => 'Lỗi hệ thống: ' . $e->getMessage(),
                'error_code' => 500,
                'data' => null
            ], 500);
        }
    }
    public function destroy(LoanRequest $loanRequest)
    {
        try {
            if ($loanRequest->details()->exists()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Phiếu mượn đã được cấp máy, không thể xóa.',
                    'error_code' => 400,
                    'data' => null
                ], 400);
            }

            $loanRequest->delete();

            return response()->json([
                'status' => true,
                'message' => 'Xóa phiếu mượn thành công',
                'error_code' => 0,
                'data' => null
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi hệ thống: ' . $e->getMessage(),
                'error_code' => 500,
                'data' => null
            ], 500);
        }
    }
}
