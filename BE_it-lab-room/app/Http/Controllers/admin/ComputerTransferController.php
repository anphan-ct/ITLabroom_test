<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ComputerTransferRequest;
use App\Http\Resources\ComputerTransferHistoryResource;
use App\Models\Computer;
use App\Models\ComputerTransferHistory;
use App\Models\ComputerTransferDetail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Throwable;

class ComputerTransferController extends Controller
{
    /**
     * Lấy danh sách lịch sử điều chuyển máy tính.
     * Load computers thủ công từ may_tinh_ids (JSON) bằng 1 query tránh N+1.
     */
    public function index()
    {
        try {
            $transfers = ComputerTransferHistory::query()
                ->select([
                    'id',
                    'ma_phong_cu',
                    'ma_phong_moi',
                    'ma_nguoi_dieu_chuyen',
                    'thoi_gian_dieu_chuyen',
                    'ly_do',
                    'ghi_chu',
                    'created_at',
                ])
                ->with([
                    'oldRoom:id,ma_phong,ten_phong',
                    'newRoom:id,ma_phong,ten_phong',
                    'transferredBy:id,ho_ten',
                    'details.computer:id,ma_may,ten_may',
                ])
                ->latest('id')
                ->get();

            return response()->json([
                'status'     => true,
                'message'    => 'Lấy danh sách lịch sử điều chuyển thành công',
                'error_code' => 200,
                'data'       => ComputerTransferHistoryResource::collection($transfers),
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'status'     => false,
                'message'    => 'Hiện tại tôi không thể xử lí yêu cầu của bạn',
                'error_code' => 500,
                'data'       => '',
            ], 500);
        }
    }

    /**
     * Thực hiện điều chuyển máy tính sang phòng mới.
     * Cập nhật ma_phong trong bảng may_tinh + ghi log vào lich_su_dieu_chuyen_may.
     */
    public function store(ComputerTransferRequest $request)
    {
        try {
            $data = $request->validated();

            $transfer = DB::transaction(function () use ($data) {
                // Lấy và khoá toàn bộ máy tính cần điều chuyển, tránh race condition
                $computers = Computer::whereIn('id', $data['may_tinh_ids'])
                    ->lockForUpdate()
                    ->get();

                // Suy ra phòng cũ từ máy đầu tiên (đã validate cùng phòng ở FormRequest)
                $maPhongCu = $computers->first()->ma_phong;

                // Cập nhật phòng mới cho TẤT CẢ máy tính bằng 1 query
                Computer::whereIn('id', $data['may_tinh_ids'])->update([
                    'ma_phong' => $data['ma_phong_moi'],
                ]);

                // Ghi log lịch sử điều chuyển (1 bản ghi duy nhất)
                $transfer = ComputerTransferHistory::create([
                    'ma_phong_cu'           => $maPhongCu,
                    'ma_phong_moi'          => $data['ma_phong_moi'],
                    'ma_nguoi_dieu_chuyen'  => Auth::id(),
                    'thoi_gian_dieu_chuyen' => now(),
                    'ly_do'                 => $data['ly_do'],
                    'ghi_chu'               => $data['ghi_chu'] ?? null,
                ]);

                // Ghi chi tiết máy tính vào bảng chi_tiet_dieu_chuyen_may
                $rows = collect($data['may_tinh_ids'])->map(fn ($id) => [
                    'ma_lich_su_dieu_chuyen' => $transfer->id,
                    'ma_may_tinh'            => $id,
                    'created_at'             => now(),
                    'updated_at'             => now(),
                ])->all();

                ComputerTransferDetail::insert($rows);

                // Load quan hệ Eloquent chuẩn
                $transfer->load([
                    'oldRoom:id,ma_phong,ten_phong',
                    'newRoom:id,ma_phong,ten_phong',
                    'transferredBy:id,ho_ten',
                    'details.computer:id,ma_may,ten_may',
                ]);

                return $transfer;
            });

            return response()->json([
                'status'     => true,
                'message'    => 'Điều chuyển máy tính thành công',
                'error_code' => 200,
                'data'       => new ComputerTransferHistoryResource($transfer),
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'status'     => false,
                'message'    => 'Dữ liệu điều chuyển không hợp lệ',
                'error_code' => 422,
                'data'       => $e->errors(),
            ], 422);
        } catch (Throwable $e) {
            return response()->json([
                'status'     => false,
                'message'    => 'Hiện tại tôi không thể xử lí yêu cầu của bạn',
                'error_code' => 500,
                'data'       => '',
            ], 500);
        }
    }
}
