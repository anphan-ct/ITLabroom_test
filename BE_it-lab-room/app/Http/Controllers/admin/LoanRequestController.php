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
            $status = $request->query('trang_thai', LoanRequestStatus::PENDING->value);

            $query = LoanRequest::with(['department', 'details.computer']);

            if ($status !== 'all') {
                $query->where('trang_thai', $status);
            }

            $requests = $query->orderBy('created_at', 'desc')->paginate(15);
            $requests->getCollection()->transform(function ($item) {
                return new LoanRequestResource($item);
            });

            return response()->json([
                'status' => true,
                'message' => 'Lấy danh sách phiếu mượn thành công',
                'error_code' => 0,
                'data' => $requests
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
}
