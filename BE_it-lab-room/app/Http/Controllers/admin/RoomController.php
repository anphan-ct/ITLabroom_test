<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\RoomRequest;
use App\Http\Resources\ComputerResource;
use App\Http\Resources\RoomResource;
use App\Models\Room;
use Illuminate\Http\Request;
use Throwable;

class RoomController extends Controller
{
    public function store(RoomRequest $request)
    {
        try {
            $data = $request->validated();

            $room = Room::create([
                'ma_phong' => strtoupper(trim($data['ma_phong'])),
                'ten_phong' => trim($data['ten_phong']),
                'suc_chua' => $data['suc_chua'],
                'trang_thai' => $data['trang_thai'] ?? 'active',
                'mo_ta' => $data['mo_ta'] ?? null,
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Tạo phòng máy thành công',
                'error_code' => 201,
                'data' => new RoomResource($room),
            ], 201);
        } catch (Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Hiện tại tôi không thể xử lí yêu cầu của bạn',
                'error_code' => 500,
                'data' => '',
            ], 500);
        }
    }

    public function index()
    {
        try {

            $rooms = Room::query()
                ->select(['id', 'ma_phong', 'ten_phong', 'suc_chua', 'trang_thai', 'mo_ta'])
                ->where('trang_thai', 'active')
                ->orderByRaw("
                    CAST(REPLACE(SUBSTRING_INDEX(ma_phong, '.', 1), 'F', '') AS UNSIGNED)
                ")
                ->orderByRaw("
                    CAST(SUBSTRING_INDEX(ma_phong, '.', -1) AS UNSIGNED)
                ")
                ->get();

            return response()->json([
                'status' => true,
                'message' => 'Lấy danh sách phòng máy thành công',
                'error_code' => 200,
                'data' => RoomResource::collection($rooms),
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Hiện tại tôi không thể xử lí yêu cầu của bạn',
                'error_code' => 500,
                'data' => '',
            ], 500);
        }
    }

    public function show(Room $room)
    {
        try {
            return response()->json([
                'status' => true,
                'message' => 'Lấy chi tiết phòng máy thành công',
                'error_code' => 200,
                'data' => new RoomResource($room),
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Hiện tại tôi không thể xử lí yêu cầu của bạn',
                'error_code' => 500,
                'data' => '',
            ], 500);
        }
    }

    public function computers(Request $request, Room $room)
    {
        try {
            $request->validate([]);

            // Chỉ lấy máy thuộc phòng đang chọn và eager load phòng để tránh N+1.
            $computers = $room->computers()
                ->select([
                    'id',
                    'ma_phong',
                    'ma_may',
                    'ten_may',
                    'vi_tri',
                    'ma_qr',
                    'bo_xu_ly',
                    'ram',
                    'card_do_hoa',
                    'bo_mach_chu',
                    'man_hinh',
                    'ban_phim',
                    'chuot',
                    'hdd',
                    'ssd',
                    'trang_thai',
                    'ghi_chu',
                ])
                ->with('room:id,ma_phong,ten_phong')
                ->orderBy('ma_may')
                ->get();

            // Lấy danh sách thiết bị thuộc phòng để hiển thị trong form báo cáo sự cố
            $equipments = $room->equipments()
                ->select(['id', 'ma_phong', 'ten_thiet_bi', 'so_luong', 'don_vi', 'trang_thai', 'ghi_chu'])
                ->orderBy('ten_thiet_bi')
                ->get();

            return response()->json([
                'status' => true,
                'message' => 'Lấy danh sách máy tính theo phòng thành công',
                'error_code' => 200,
                'data' => [
                    'room'       => new RoomResource($room),
                    'computers'  => ComputerResource::collection($computers),
                    'equipments' => $equipments,
                ],
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Hiện tại tôi không thể xử lí yêu cầu của bạn',
                'error_code' => 500,
                'data' => '',
            ], 500);
        }
    }

    public function update(RoomRequest $request, Room $room)
    {
        try {
            $data = $request->validated();

            // Cập nhật trực tiếp thông tin phòng máy, giữ nguyên các quan hệ hiện có.
            $room->update([
                'ma_phong' => strtoupper($data['ma_phong']),
                'ten_phong' => $data['ten_phong'],
                'suc_chua' => $data['suc_chua'],
                'trang_thai' => $data['trang_thai'] ?? 'active',
                'mo_ta' => $data['mo_ta'] ?? null,
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Cập nhật phòng máy thành công',
                'error_code' => 200,
                'data' => new RoomResource($room),
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Hiện tại tôi không thể xử lí yêu cầu của bạn',
                'error_code' => 500,
                'data' => '',
            ], 500);
        }
    }

    public function destroy(Request $request, Room $room)
    {
        $request->validate([]);

        try {
            
            $room->loadCount([
                'computers',
                'equipments',
                'computerLabSchedules',
                'roomBookingRequests',
            ]);

            if (
                $room->computers_count > 0
                || $room->equipments_count > 0
                || $room->room_usage_histories_count > 0
                || $room->room_booking_requests_count > 0
            ) {
                return response()->json([
                    'status' => false,
                    'message' => 'Không thể xóa phòng máy vì đã có dữ liệu liên quan',
                    'error_code' => 409,
                    'data' => '',
                ], 409);
            }

            $room->delete();

            return response()->json([
                'status' => true,
                'message' => 'Xóa phòng máy thành công',
                'error_code' => 200,
                'data' => '',
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Hiện tại tôi không thể xử lí yêu cầu của bạn',
                'error_code' => 500,
                'data' => '',
            ], 500);
        }
    }
}
