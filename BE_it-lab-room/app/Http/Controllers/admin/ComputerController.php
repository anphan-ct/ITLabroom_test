<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ComputerUpdateRequest;
use App\Http\Resources\ComputerResource;
use App\Models\Computer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Throwable;

class ComputerController extends Controller
{
    public function index(Request $request)
    {
        try {
           
            $query = Computer::query()
                ->select([
                    'id',
                    'ma_phong',
                    'ma_may',
                    'ten_may',
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
                ->with('room:id,ma_phong,ten_phong');

            if ($request->filled('ma_phong') && $request->query('ma_phong') !== 'all') {
                $query->where('ma_phong', $request->query('ma_phong'));
            }

            $computers = $query->orderBy('ma_may')->get();

            return response()->json([
                'status' => true,
                'message' => 'Lấy danh sách máy tính thành công',
                'error_code' => 200,
                'data' => ComputerResource::collection($computers),
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

    public function show(Computer $computer)
    {
        try {

            $computer->load('room:id,ma_phong,ten_phong');

            return response()->json([
                'status' => true,
                'message' => 'Lấy chi tiết máy tính thành công',
                'error_code' => 200,
                'data' => new ComputerResource($computer),
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

    public function showByQrCode(string $qrCode)
    {
        try {
            $computer = Computer::query()
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
                ->where('ma_qr', $qrCode)
                ->first();

            if (! $computer) {
                return response()->json([
                    'status' => false,
                    'message' => 'Không tìm thấy máy tính từ mã QR',
                    'error_code' => 404,
                    'data' => '',
                ], 404);
            }

            return response()->json([
                'status' => true,
                'message' => 'Lấy thông tin máy tính từ mã QR thành công',
                'error_code' => 200,
                'data' => new ComputerResource($computer),
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

    public function update(ComputerUpdateRequest $request, Computer $computer)
    {
        try {
            $data = $request->validated();

            DB::transaction(function () use ($computer, $data) {
                // Cập nhật một máy cụ thể, không ảnh hưởng các máy khác cùng phiếu nhập.
                $computer->update([
                    'ma_phong' => $data['ma_phong'],
                    'ma_may' => strtoupper($data['ma_may']),
                    'ten_may' => $data['ten_may'],
                    'vi_tri' => $data['vi_tri'] ?? null,
                    'ma_qr' => $data['ma_qr'] ?? null,
                    'bo_xu_ly' => $data['bo_xu_ly'] ?? null,
                    'ram' => $data['ram'] ?? null,
                    'card_do_hoa' => $data['card_do_hoa'] ?? null,
                    'bo_mach_chu' => $data['bo_mach_chu'] ?? null,
                    'man_hinh' => $data['man_hinh'] ?? null,
                    'ban_phim' => $data['ban_phim'] ?? null,
                    'chuot' => $data['chuot'] ?? null,
                    'hdd' => $data['hdd'] ?? null,
                    'ssd' => $data['ssd'] ?? null,
                    'trang_thai' => $data['trang_thai'],
                    'ghi_chu' => $data['ghi_chu'] ?? null,
                ]);
            });

            $computer->load('room:id,ma_phong,ten_phong');

            return response()->json([
                'status' => true,
                'message' => 'Cập nhật máy tính thành công',
                'error_code' => 200,
                'data' => new ComputerResource($computer),
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

    public function generateQrCode(Computer $computer)
    {
        try {
            DB::transaction(function () use ($computer) {
                // Sinh lại mã QR duy nhất cho máy tính để in tem hoặc quét điểm danh.
                $computer->update([
                    'ma_qr' => $this->generateUniqueQrCode($computer),
                ]);
            });

            $computer->load('room:id,ma_phong,ten_phong');

            return response()->json([
                'status' => true,
                'message' => 'Tạo lại mã QR máy tính thành công',
                'error_code' => 200,
                'data' => new ComputerResource($computer),
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Không thể tạo mã QR máy tính',
                'error_code' => 422,
                'data' => $e->errors(),
            ], 422);
        } catch (Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Hiện tại tôi không thể xử lí yêu cầu của bạn',
                'error_code' => 500,
                'data' => '',
            ], 500);
        }
    }

    private function generateUniqueQrCode(Computer $computer): string
    {
        $maMay = strtoupper(preg_replace('/[^A-Z0-9]+/', '-', $computer->ma_may));

        for ($attempt = 1; $attempt <= 50; $attempt++) {
            $code = 'QR-'.$maMay.'-'.strtoupper(bin2hex(random_bytes(4)));

            if (! Computer::query()->where('ma_qr', $code)->whereKeyNot($computer->id)->exists()) {
                return $code;
            }
        }

        throw ValidationException::withMessages([
            'ma_qr' => ['Không thể tạo mã QR duy nhất, vui lòng thử lại.'],
        ]);
    }

    public function destroy(Request $request, Computer $computer)
    {
        $request->validate([]);

        try {
            DB::transaction(function () use ($computer) {

                DB::table('chi_tiet_phieu_nhap_may')
                    ->where('ma_may_tinh', $computer->id)
                    ->delete();

                DB::table('chi_tiet_phieu_muon_may')
                    ->where('ma_may_tinh', $computer->id)
                    ->delete();

                DB::table('chi_tiet_phieu_tra_may')
                    ->where('ma_may_tinh', $computer->id)
                    ->delete();

                $computer->delete();
            });

            return response()->json([
                'status' => true,
                'message' => 'Xóa vĩnh viễn máy tính thành công',
                'error_code' => 200,
                'data' => '',
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Không thể xóa vĩnh viễn máy tính vì đã có dữ liệu liên quan',
                'error_code' => 500,
                'data' => '',
            ], 500);
        }
    }
}
