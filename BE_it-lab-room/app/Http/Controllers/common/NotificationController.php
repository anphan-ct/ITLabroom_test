<?php

namespace App\Http\Controllers\common;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Throwable;

class NotificationController extends Controller
{
    /**
     * Lấy danh sách thông báo của người dùng đăng nhập
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Notification::where('ma_nguoi_dung', Auth::id());

            if ($request->filled('status') && $request->input('status') === 'unread') {
                $query->where('da_doc', false);
            }

            $notifications = $query->orderByDesc('id')->paginate(15);

            return response()->json([
                'status'     => true,
                'message'    => 'Lấy danh sách thông báo thành công',
                'error_code' => 200,
                'data'       => NotificationResource::collection($notifications),
                'pagination' => [
                    'current_page' => $notifications->currentPage(),
                    'last_page'    => $notifications->lastPage(),
                    'per_page'     => $notifications->perPage(),
                    'total'        => $notifications->total(),
                ],
            ], 200);
        } catch (Throwable $e) {
            Log::error('Common\NotificationController@index: ' . $e->getMessage());
            return response()->json([
                'status'     => false,
                'message'    => 'Hiện tại không thể xử lý yêu cầu của bạn',
                'error_code' => 500,
                'data'       => '',
            ], 500);
        }
    }

    /**
     * Lấy số lượng thông báo chưa đọc
     */
    public function unreadCount(): JsonResponse
    {
        try {
            $count = Notification::where('ma_nguoi_dung', Auth::id())
                ->where('da_doc', false)
                ->count();

            return response()->json([
                'status'     => true,
                'message'    => 'Lấy số lượng thông báo chưa đọc thành công',
                'error_code' => 200,
                'data'       => ['unread_count' => $count],
            ], 200);
        } catch (Throwable $e) {
            Log::error('Common\NotificationController@unreadCount: ' . $e->getMessage());
            return response()->json([
                'status'     => false,
                'message'    => 'Hiện tại không thể xử lý yêu cầu của bạn',
                'error_code' => 500,
                'data'       => '',
            ], 500);
        }
    }

    /**
     * Đánh dấu 1 thông báo là đã đọc
     */
    public function markAsRead(Notification $notification): JsonResponse
    {
        try {
            if ($notification->ma_nguoi_dung !== Auth::id()) {
                return response()->json([
                    'status'     => false,
                    'message'    => 'Bạn không có quyền đánh dấu thông báo này',
                    'error_code' => 403,
                    'data'       => '',
                ], 403);
            }

            $notification->update(['da_doc' => true]);

            return response()->json([
                'status'     => true,
                'message'    => 'Đánh dấu đã đọc thành công',
                'error_code' => 200,
                'data'       => new NotificationResource($notification),
            ], 200);
        } catch (Throwable $e) {
            Log::error('Common\NotificationController@markAsRead: ' . $e->getMessage());
            return response()->json([
                'status'     => false,
                'message'    => 'Hiện tại không thể xử lý yêu cầu của bạn',
                'error_code' => 500,
                'data'       => '',
            ], 500);
        }
    }

    /**
     * Đánh dấu tất cả là đã đọc
     */
    public function markAllAsRead(): JsonResponse
    {
        try {
            Notification::where('ma_nguoi_dung', Auth::id())
                ->where('da_doc', false)
                ->update(['da_doc' => true]);

            return response()->json([
                'status'     => true,
                'message'    => 'Đánh dấu tất cả đã đọc thành công',
                'error_code' => 200,
                'data'       => '',
            ], 200);
        } catch (Throwable $e) {
            Log::error('Common\NotificationController@markAllAsRead: ' . $e->getMessage());
            return response()->json([
                'status'     => false,
                'message'    => 'Hiện tại không thể xử lý yêu cầu của bạn',
                'error_code' => 500,
                'data'       => '',
            ], 500);
        }
    }
}
