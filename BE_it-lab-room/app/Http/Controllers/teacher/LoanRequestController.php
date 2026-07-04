<?php

namespace App\Http\Controllers\teacher;

use App\Http\Controllers\Controller;
use App\Models\LoanRequest;
use App\Http\Requests\LoanRequestRequest;
use App\Enums\LoanRequestStatus;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Throwable;
use App\Http\Resources\LoanRequestResource;

class LoanRequestController extends Controller
{
    public function index()
    {
        try {
            $teacherId = Auth::user()->teacher->id;
            $requests = LoanRequest::where('ma_giang_vien', $teacherId)
                ->with(['teacher.user', 'department', 'details.computer'])
                ->orderBy('created_at', 'desc')
                ->paginate(15);
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
            $teacher = Auth::user()->teacher;
            
            $data = $request->validated();
            $data['ma_phieu_muon'] = 'PM-' . strtoupper(Str::random(8));
            $data['ma_giang_vien'] = $teacher->id;
            $data['ma_phong_ban'] = $teacher->ma_phong_ban;
            $data['trang_thai'] = LoanRequestStatus::PENDING->value;

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
}
