<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminRoomBookingRequest;
use App\Http\Resources\RoomBookingResource;
use App\Models\ComputerLabSchedule;
use App\Models\Room;
use App\Models\RoomBooking;
use Illuminate\Support\Facades\DB;
use Throwable;

class RoomBookingController extends Controller
{
    public function index(AdminRoomBookingRequest $request)
    {
        try {
            $data = $request->validated();
            $keyword = $data['keyword'] ?? null;

            $bookings = RoomBooking::query()
                ->with($this->relations())
                ->when(
                    $data['status'] ?? null,
                    fn($query, $status) => $query->where('trang_thai_duyet', $status)
                )
                ->when($keyword, fn($query) => $query->where(function ($subQuery) use ($keyword) {
                    $subQuery->where('muc_dich', 'like', "%{$keyword}%")
                        ->orWhereHas('room', fn($roomQuery) => $roomQuery
                            ->where('ma_phong', 'like', "%{$keyword}%"))
                        ->orWhereHas('teacher.user', fn($userQuery) => $userQuery
                            ->where('ho_ten', 'like', "%{$keyword}%"));
                }))
                ->orderByRaw("CASE WHEN trang_thai_duyet = 'pending' THEN 0 ELSE 1 END")
                ->orderByDesc('created_at')
                ->paginate($data['per_page'] ?? 20);

            return response()->json([
                'status' => true,
                'message' => 'Lấy danh sách đăng ký phòng thành công',
                'error_code' => 200,
                'data' => [
                    'items' => RoomBookingResource::collection($bookings),
                    'pagination' => [
                        'current_page' => $bookings->currentPage(),
                        'per_page' => $bookings->perPage(),
                        'total' => $bookings->total(),
                        'last_page' => $bookings->lastPage(),
                    ],
                ],
            ], 200);
        } catch (Throwable $e) {
            return $this->serverErrorResponse();
        }
    }

    public function update(AdminRoomBookingRequest $request, RoomBooking $roomBooking)
    {
        try {
            $data = $request->validated();

            $result = DB::transaction(function () use ($roomBooking, $data) {
                $booking = RoomBooking::query()
                    ->whereKey($roomBooking->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $booking->load(['room', 'teacher']);

                if ($booking->trang_thai_duyet !== 'pending') {
                    return 'Yêu cầu này đã được xử lý trước đó.';
                }

                if ($data['approval_status'] === 'rejected') {
                    $booking->update([
                        'trang_thai_duyet' => 'rejected',
                    ]);

                    $roomName = $booking->room->ten_phong ?? $booking->room->ma_phong;
                    $ngayDat = $booking->ngay_dat->format('d/m/Y');
                    $noiDung = "Yêu cầu đặt phòng {$roomName} vào ngày {$ngayDat} (tiết {$booking->tiet_bat_dau}-{$booking->tiet_ket_thuc}) đã bị từ chối.";
                    \App\Services\NotificationService::notifyUser($booking->teacher->ma_nguoi_dung, "Yêu cầu đặt phòng bị từ chối", $noiDung, \App\Models\Notification::DAT_PHONG_TU_CHOI);

                    return $booking;
                }

                $room = Room::query()
                    ->whereKey($booking->ma_phong)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($room->trang_thai !== 'active') {
                    return 'Phòng máy hiện không sẵn sàng để duyệt.';
                }

                $hasScheduleConflict = ComputerLabSchedule::query()
                    ->where('ma_phong', $booking->ma_phong)
                    ->whereDate('ngay_hoc_cu_the', $booking->ngay_dat)
                    ->where('trang_thai', '!=', 'cancelled')
                    ->where('so_tiet_bat_dau', '<=', $booking->tiet_ket_thuc)
                    ->where('so_tiet_ket_thuc', '>=', $booking->tiet_bat_dau)
                    ->exists();

                if ($hasScheduleConflict) {
                    return 'Phòng đã phát sinh lịch sử dụng trùng thời gian.';
                }

                $booking->update([
                    'trang_thai_duyet' => 'approved',
                ]);

                $roomName = $booking->room->ten_phong ?? $booking->room->ma_phong;
                $ngayDat = $booking->ngay_dat->format('d/m/Y');
                $noiDung = "Yêu cầu đặt phòng {$roomName} vào ngày {$ngayDat} (tiết {$booking->tiet_bat_dau}-{$booking->tiet_ket_thuc}) đã được duyệt.";
                \App\Services\NotificationService::notifyUser($booking->teacher->ma_nguoi_dung, "Yêu cầu đặt phòng đã được duyệt", $noiDung, \App\Models\Notification::DAT_PHONG_DUYET);

                return $booking;
            }, 3);

            if (is_string($result)) {
                return response()->json([
                    'status' => false,
                    'message' => $result,
                    'error_code' => 409,
                    'data' => '',
                ], 409);
            }

            $result->load($this->relations());

            return response()->json([
                'status' => true,
                'message' => $data['approval_status'] === 'approved'
                    ? 'Duyệt yêu cầu đăng ký phòng thành công'
                    : 'Từ chối yêu cầu đăng ký phòng thành công',
                'error_code' => 200,
                'data' => new RoomBookingResource($result),
            ], 200);
        } catch (Throwable $e) {
            return $this->serverErrorResponse();
        }
    }

    private function relations(): array
    {
        return [
            'teacher:id,ma_nguoi_dung,ma_giang_vien',
            'teacher.user:id,ho_ten',
            'room:id,ma_phong,ten_phong',
        ];
    }

    private function serverErrorResponse()
    {
        return response()->json([
            'status' => false,
            'message' => 'Không thể xử lý yêu cầu đăng ký phòng',
            'error_code' => 500,
            'data' => '',
        ], 500);
    }
}
