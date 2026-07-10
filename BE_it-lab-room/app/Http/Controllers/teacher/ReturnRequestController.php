<?php

namespace App\Http\Controllers\teacher;

use App\Http\Controllers\Controller;
use App\Models\ReturnRequest;
use App\Http\Requests\ReturnRequestRequest;
use App\Enums\ReturnRequestStatus;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;
use App\Http\Resources\ReturnRequestResource;

class ReturnRequestController extends Controller
{
    public function index()
    {
        try {
            $borrowerName = Auth::user()->ho_ten;
            $requests = ReturnRequest::query()
                ->whereHas('loanRequest', function ($query) use ($borrowerName) {
                    $query->where('nguoi_muon', $borrowerName);
                })
                ->with(['loanRequest.details.computer', 'details.computer'])
                ->orderBy('created_at', 'desc')
                ->paginate(15);
            $requests->getCollection()->transform(function ($item) {
                return new ReturnRequestResource($item);
            });

            return response()->json([
                'status' => true,
                'message' => 'Lấy danh sách phiếu trả thành công',
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

    /**
     * Sinh mã phiếu trả dạng PT-XXXXXX (6 ký tự ngẫu nhiên),
     * kiểm tra trùng trong database, retry tối đa 50 lần.
     */
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
}
