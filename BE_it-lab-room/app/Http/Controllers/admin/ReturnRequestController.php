<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Models\ReturnRequest;
use App\Models\Computer;
use App\Models\ReturnRequestDetail;
use App\Http\Requests\ReturnRequestConfirmRequest;
use App\Enums\ReturnRequestStatus;
use App\Enums\ComputerStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;
use App\Http\Resources\ReturnRequestResource;

class ReturnRequestController extends Controller
{
    public function index(Request $request)
    {
        try {
            $status = $request->query('trang_thai', 'all');
            
            $query = ReturnRequest::with(['teacher.user', 'loanRequest.details.computer.room', 'details.computer']);
            
            if ($status !== 'all') {
                $query->where('trang_thai', $status);
            }

            $requests = $query->orderBy('created_at', 'desc')->paginate(15);
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

    public function confirm(ReturnRequestConfirmRequest $request, ReturnRequest $returnRequest)
    {
        DB::beginTransaction();
        try {
            $action = $request->input('action');
            
            if ($action === 'needs_inspection') {
                $returnRequest->update(['trang_thai' => ReturnRequestStatus::NEEDS_INSPECTION->value]);
                DB::commit();
                return response()->json([
                    'status' => true,
                    'message' => 'Đã đánh dấu phiếu trả cần kiểm tra',
                    'error_code' => 0,
                    'data' => $returnRequest
                ], 200);
            }

            // confirm
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
}
