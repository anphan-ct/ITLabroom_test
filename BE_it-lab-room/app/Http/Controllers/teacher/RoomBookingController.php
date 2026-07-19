<?php

namespace App\Http\Controllers\teacher;

use App\Http\Controllers\Controller;
use App\Http\Requests\TeacherRoomBookingRequest;
use App\Http\Resources\RoomBookingResource;
use App\Http\Resources\RoomResource;
use App\Http\Resources\WeekResource;
use App\Models\ComputerLabSchedule;
use App\Models\Room;
use App\Models\RoomBooking;
use App\Models\Week;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class RoomBookingController extends Controller
{
    public function index(TeacherRoomBookingRequest $request)
    {
        try {
            $data = $request->validated();
            $teacher = $request->user()?->teacher;

            if (! $teacher) {
                return $this->forbiddenResponse();
            }

            $bookings = RoomBooking::query()
                ->where('ma_giang_vien', $teacher->id)
                ->when($data['status'] ?? null, fn($query, $status) => $query->where('trang_thai_duyet', $status))
                ->with($this->relations())
                ->orderByDesc('created_at')
                ->get();

            return response()->json([
                'status' => true,
                'message' => 'Lấy danh sách yêu cầu đặt phòng thành công',
                'error_code' => 200,
                'data' => [
                    'items' => RoomBookingResource::collection($bookings),
                ],
            ], 200);
        } catch (Throwable $e) {
            return $this->serverErrorResponse('Không thể lấy danh sách yêu cầu đặt phòng');
        }
    }

    public function availability(Request $request)
    {
        try {
            $data = $request->validate([
                'date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
                'lesson_start' => ['required', 'integer', 'min:1', 'max:12'],
                'lesson_end' => ['required', 'integer', 'min:1', 'max:12', 'gte:lesson_start'],
            ]);

            $bookingRoomIds = RoomBooking::query()
                ->whereDate('ngay_dat', $data['date'])
                ->where('trang_thai_duyet', 'approved')
                ->where('tiet_bat_dau', '<=', $data['lesson_end'])
                ->where('tiet_ket_thuc', '>=', $data['lesson_start'])
                ->pluck('ma_phong');
            $scheduleRoomIds = ComputerLabSchedule::query()
                ->whereDate('ngay_hoc_cu_the', $data['date'])
                ->where('trang_thai', '!=', 'cancelled')
                ->where('so_tiet_bat_dau', '<=', $data['lesson_end'])
                ->where('so_tiet_ket_thuc', '>=', $data['lesson_start'])
                ->pluck('ma_phong');
            // Lấy tuần tương ứng với ngày được chọn để giao diện đăng ký hiển thị rõ ngữ cảnh năm học.
            $week = Week::query()
                ->select(['id', 'ma_nam_hoc', 'so_tuan', 'ngay_bat_dau', 'ngay_ket_thuc'])
                ->whereDate('ngay_bat_dau', '<=', $data['date'])
                ->whereDate('ngay_ket_thuc', '>=', $data['date'])
                ->orderByDesc('ngay_bat_dau')
                ->first();

            $rooms = Room::query()
                ->select(['id', 'ma_phong', 'ten_phong', 'suc_chua', 'trang_thai', 'mo_ta'])
                // Không hiển thị phòng kho trong danh sách đăng ký phòng.
                ->where('ma_phong', '!=', 'KHO')
                ->orderBy('ma_phong')
                ->get()
                ->map(function (Room $room) use ($bookingRoomIds, $scheduleRoomIds) {
                    $reason = null;

                    if ($room->trang_thai !== 'active') {
                        $reason = $room->trang_thai === 'maintenance' ? 'maintenance' : 'inactive';
                    } elseif ($scheduleRoomIds->contains($room->id)) {
                        $reason = 'schedule';
                    } elseif ($bookingRoomIds->contains($room->id)) {
                        $reason = 'booking';
                    }

                    return [
                        ...RoomResource::make($room)->resolve(),
                        'is_available' => $reason === null,
                        'unavailable_reason' => $reason,
                    ];
                });

            return response()->json([
                'status' => true,
                'message' => 'Kiểm tra phòng trống thành công',
                'error_code' => 200,
                'data' => [
                    'week' => $week ? new WeekResource($week) : null,
                    'items' => $rooms,
                ],
            ], 200);
        } catch (Throwable $e) {
            return $this->serverErrorResponse('Không thể kiểm tra phòng trống');
        }
    }

    public function store(TeacherRoomBookingRequest $request)
    {
        return $this->createBooking($request, 'pending', 'Gửi yêu cầu đặt phòng thành công');
    }

    public function quickStore(TeacherRoomBookingRequest $request)
    {
        if ($request->validated('ngay_dat') !== now()->toDateString()) {
            return response()->json([
                'status' => false,
                'message' => 'Mượn phòng nhanh chỉ áp dụng cho ngày hiện tại.',
                'error_code' => 422,
                'data' => [
                    'ngay_dat' => ['Mượn phòng nhanh chỉ áp dụng cho ngày hiện tại.'],
                ],
            ], 422);
        }

        return $this->createBooking($request, 'approved', 'Mượn phòng nhanh thành công');
    }

    private function createBooking(TeacherRoomBookingRequest $request, string $approvalStatus, string $successMessage)
    {
        try {
            $data = $request->validated();
            $teacher = $request->user()?->teacher;

            if (! $teacher) {
                return $this->forbiddenResponse();
            }

            $result = DB::transaction(function () use ($request, $data, $teacher, $approvalStatus) {
                $room = Room::query()->whereKey($data['ma_phong'])->lockForUpdate()->firstOrFail();

                if (str_contains(mb_strtolower($room->ten_phong ?? ''), 'kho')) {
                    return 'Không thể đăng ký phòng kho.';
                }

                if ($room->trang_thai !== 'active') {
                    return 'Phòng máy hiện không sẵn sàng để đăng ký.';
                }

                if ($this->hasConflict($data)) {
                    return 'Phòng đã có yêu cầu đặt hoặc lịch sử dụng trùng thời gian.';
                }

                $booking = RoomBooking::create([
                    'ma_giang_vien' => $teacher->id,
                    'ma_phong' => $data['ma_phong'],
                    'ngay_dat' => $data['ngay_dat'],
                    'tiet_bat_dau' => $data['so_tiet_bat_dau'],
                    'tiet_ket_thuc' => $data['so_tiet_ket_thuc'],
                    'muc_dich' => $data['muc_dich'],
                    'trang_thai_duyet' => $approvalStatus,
                ]);

                $userName = $request->user()->ho_ten ?? $request->user()->name ?? 'Giảng viên';
                $roomName = $room->ten_phong ?? $room->ma_phong;

                if ($approvalStatus === 'pending') {
                    $tieuDe = 'Yêu cầu đặt phòng mới';
                    $noiDung = "Giảng viên {$userName} đã gửi yêu cầu đặt phòng {$roomName} vào ngày {$data['ngay_dat']}, từ tiết {$data['so_tiet_bat_dau']} đến tiết {$data['so_tiet_ket_thuc']}.";
                    \App\Services\NotificationService::notifyRole('admin', $tieuDe, $noiDung, \App\Models\Notification::DAT_PHONG_MOI);
                } else {
                    $tieuDe = 'Mượn phòng nhanh';
                    $noiDung = "Giảng viên {$userName} vừa mượn nhanh phòng {$roomName} vào ngày {$data['ngay_dat']}, từ tiết {$data['so_tiet_bat_dau']} đến tiết {$data['so_tiet_ket_thuc']}.";
                    \App\Services\NotificationService::notifyRole('admin', $tieuDe, $noiDung, \App\Models\Notification::MUON_PHONG_NHANH);
                }

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
                'message' => $successMessage,
                'error_code' => 201,
                'data' => new RoomBookingResource($result),
            ], 201);
        } catch (Throwable $e) {
            return $this->serverErrorResponse('Không thể gửi yêu cầu đặt phòng');
        }
    }

    public function cancel(int $id, Request $request)
    {
        try {
            $teacher = $request->user()?->teacher;

            if (! $teacher) {
                return $this->forbiddenResponse();
            }

            $booking = RoomBooking::query()
                ->whereKey($id)
                ->where('ma_giang_vien', $teacher->id)
                ->lockForUpdate()
                ->firstOrFail();

            // Chỉ cho giảng viên hủy yêu cầu còn chờ duyệt; yêu cầu đã được admin xử lý phải giữ nguyên lịch sử.
            if ($booking->trang_thai_duyet !== 'pending') {
                return response()->json([
                    'status' => false,
                    'message' => 'Chỉ có thể hủy yêu cầu đang chờ duyệt',
                    'error_code' => 409,
                    'data' => '',
                ], 409);
            }

            // Hủy yêu cầu bằng cách xóa bản ghi đặt phòng của chính giảng viên đang đăng nhập.
            $booking->delete();

            return response()->json([
                'status' => true,
                'message' => 'Hủy yêu cầu đặt phòng thành công',
                'error_code' => 200,
                'data' => '',
            ], 200);
        } catch (Throwable $e) {
            return $this->serverErrorResponse('Không thể hủy yêu cầu đặt phòng');
        }
    }

    private function hasConflict(array $data): bool
    {
        $bookingConflict = RoomBooking::query()
            ->where('ma_phong', $data['ma_phong'])
            ->whereDate('ngay_dat', $data['ngay_dat'])
            ->where('trang_thai_duyet', 'approved')
            ->where('tiet_bat_dau', '<=', $data['so_tiet_ket_thuc'])
            ->where('tiet_ket_thuc', '>=', $data['so_tiet_bat_dau'])
            ->exists();

        return $bookingConflict || ComputerLabSchedule::query()
            ->where('ma_phong', $data['ma_phong'])
            ->whereDate('ngay_hoc_cu_the', $data['ngay_dat'])
            ->where('trang_thai', '!=', 'cancelled')
            ->where('so_tiet_bat_dau', '<=', $data['so_tiet_ket_thuc'])
            ->where('so_tiet_ket_thuc', '>=', $data['so_tiet_bat_dau'])
            ->exists();
    }

    private function relations(): array
    {
        return [
            'room:id,ma_phong,ten_phong',
        ];
    }

    private function forbiddenResponse()
    {
        return response()->json([
            'status' => false,
            'message' => 'Tài khoản chưa có hồ sơ giảng viên',
            'error_code' => 403,
            'data' => '',
        ], 403);
    }

    private function serverErrorResponse(string $message)
    {
        return response()->json([
            'status' => false,
            'message' => $message,
            'error_code' => 500,
            'data' => '',
        ], 500);
    }
}
