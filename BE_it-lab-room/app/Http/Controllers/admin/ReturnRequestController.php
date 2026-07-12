<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Models\ReturnRequest;
use App\Models\Computer;
use App\Models\ReturnRequestDetail;
use App\Http\Requests\ReturnRequestConfirmRequest;
use App\Enums\ReturnRequestStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;
use App\Http\Resources\ReturnRequestResource;
use App\Http\Requests\ReturnRequestRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ReturnRequestController extends Controller
{
    public function index(Request $request)
    {
        try {
            $status = $request->query('trang_thai', 'all');

            $query = ReturnRequest::with(['loanRequest.details.computer.room', 'details.computer']);

            if ($status !== 'all') {
                $query->where('trang_thai', $status);
            }

            $perPage = min((int) $request->query('per_page', 15), 200);
            $requests = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return response()->json([
                'status' => true,
                'message' => 'Lấy danh sách phiếu trả thành công',
                'error_code' => 0,
                'data' => ReturnRequestResource::collection($requests),
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

    public function store(ReturnRequestRequest $request)
    {
        try {
            $data = $request->validated();

            DB::beginTransaction();

            $loanRequest = \App\Models\LoanRequest::where('id', $data['ma_phieu_muon'])->lockForUpdate()->first();

            if (!$loanRequest || $data['so_luong'] > $loanRequest->so_luong_con_lai) {
                DB::rollBack();
                $remaining = $loanRequest ? $loanRequest->so_luong_con_lai : 0;
                return response()->json([
                    'status' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'error_code' => 422,
                    'data' => [
                        'so_luong' => ["Số lượng trả vượt quá số máy chưa trả hoặc đang chờ duyệt ({$remaining} máy)."]
                    ]
                ], 422);
            }

            $data['ma_phieu_tra'] = $this->generateReturnCode();
            $data['trang_thai'] = ReturnRequestStatus::PENDING->value;

            $returnRequest = ReturnRequest::create($data);

            DB::commit();

            return response()->json([
                'status' => true,
                'message' => 'Tạo phiếu trả thành công',
                'error_code' => 0,
                'data' => $returnRequest
            ], 201);
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

    public function update(ReturnRequestRequest $request, ReturnRequest $returnRequest)
    {
        try {
            if ($returnRequest->trang_thai === ReturnRequestStatus::CONFIRMED->value) {
                return response()->json([
                    'status' => false,
                    'message' => 'Phiếu trả đã được xác nhận, không thể cập nhật.',
                    'error_code' => 400,
                    'data' => null
                ], 400);
            }

            $data = $request->validated();

            DB::beginTransaction();
            $loanRequest = \App\Models\LoanRequest::where('id', $data['ma_phieu_muon'])->lockForUpdate()->first();

            $remaining = $loanRequest ? $loanRequest->so_luong_con_lai : 0;
            // Loại trừ số lượng của chính phiếu trả này
            if ($loanRequest && $returnRequest->ma_phieu_muon == $loanRequest->id) {
                $remaining += $returnRequest->so_luong;
            }

            if (!$loanRequest || $data['so_luong'] > $remaining) {
                DB::rollBack();
                return response()->json([
                    'status' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'error_code' => 422,
                    'data' => [
                        'so_luong' => ["Số lượng trả vượt quá số máy chưa trả hoặc đang chờ duyệt ({$remaining} máy)."]
                    ]
                ], 422);
            }

            $returnRequest->update($data);
            DB::commit();

            return response()->json([
                'status' => true,
                'message' => 'Cập nhật phiếu trả thành công',
                'error_code' => 0,
                'data' => new ReturnRequestResource($returnRequest)
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

    private function generateReturnCode(): string
    {
        for ($attempt = 1; $attempt <= 50; $attempt++) {
            $code = 'PT-' . strtoupper(Str::random(6));
            if (! ReturnRequest::where('ma_phieu_tra', $code)->exists()) {
                return $code;
            }
        }
        throw ValidationException::withMessages([
            'ma_phieu_tra' => ['Không thể tạo mã phiếu trả, vui lòng thử lại.'],
        ]);
    }

    public function confirm(ReturnRequestConfirmRequest $request, ReturnRequest $returnRequest)
    {
        DB::beginTransaction();
        try {
            $conditions = $request->input('machine_conditions', []);
            $computerIds = array_column($conditions, 'ma_may_tinh');

            $computers = Computer::whereIn('id', $computerIds)->lockForUpdate()->get();

            foreach ($conditions as $cond) {
                $computerId = $cond['ma_may_tinh'];
                $tinhTrang = $cond['tinh_trang_khi_tra'];

                $computer = $computers->firstWhere('id', $computerId);
                if (!$computer) continue;

                $newStatus = $tinhTrang;

                $computer->update(['trang_thai' => $newStatus]);

                ReturnRequestDetail::create([
                    'ma_phieu_tra' => $returnRequest->id,
                    'ma_may_tinh' => $computerId,
                    'tinh_trang_khi_tra' => $tinhTrang,
                    'ghi_chu' => $cond['ghi_chu'] ?? null,
                ]);
            }

            $returnRequest->update(['trang_thai' => ReturnRequestStatus::CONFIRMED->value]);

            DB::commit();
            return response()->json([
                'status' => true,
                'message' => 'Đã xác nhận trả máy thành công',
                'error_code' => 0,
                'data' => $returnRequest->load('details.computer')
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
    public function destroy(ReturnRequest $returnRequest)
    {
        try {
            if ($returnRequest->trang_thai === ReturnRequestStatus::CONFIRMED->value) {
                return response()->json([
                    'status' => false,
                    'message' => 'Phiếu trả đã được xác nhận, không thể xóa.',
                    'error_code' => 400,
                    'data' => null
                ], 400);
            }

            $returnRequest->delete();

            return response()->json([
                'status' => true,
                'message' => 'Xóa phiếu trả thành công',
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
