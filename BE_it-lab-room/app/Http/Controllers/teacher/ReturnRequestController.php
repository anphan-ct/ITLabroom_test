<?php

namespace App\Http\Controllers\teacher;

use App\Http\Controllers\Controller;
use App\Models\ReturnRequest;
use App\Http\Requests\ReturnRequestRequest;
use App\Enums\ReturnRequestStatus;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Throwable;
use App\Http\Resources\ReturnRequestResource;

class ReturnRequestController extends Controller
{
    public function index()
    {
        try {
            $teacherId = Auth::user()->teacher->id;
            $requests = ReturnRequest::where('ma_giang_vien', $teacherId)
                ->with(['teacher.user', 'loanRequest.details.computer', 'details.computer'])
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
            $teacher = Auth::user()->teacher;
            
            $data = $request->validated();
            $data['ma_phieu_tra'] = 'PT-' . strtoupper(Str::random(8));
            $data['ma_giang_vien'] = $teacher->id;
            $data['trang_thai'] = ReturnRequestStatus::PENDING->value;

            $returnRequest = ReturnRequest::create($data);

            return response()->json([
                'status' => true,
                'message' => 'Tạo phiếu trả thành công',
                'error_code' => 0,
                'data' => $returnRequest
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
