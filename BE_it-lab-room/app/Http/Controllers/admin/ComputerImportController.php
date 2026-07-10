<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ComputerImportRequest;
use App\Http\Resources\ComputerImportResource;
use App\Models\Computer;
use App\Models\ComputerImport;
use App\Models\ComputerImportDetail;
use App\Models\Room;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Throwable;

class ComputerImportController extends Controller
{
    public function index()
    {
        try {

            $phieuNhaps = ComputerImport::query()
                ->select(['id', 'ma_phieu_nhap', 'ngay_nhap', 'so_luong', 'nha_cung_cap', 'ghi_chu'])
                ->with([
                    'details:id,ma_phieu_nhap,ma_may_tinh,ghi_chu',
                    'details.computer:id,ma_phong,ma_may,ten_may,vi_tri,ma_qr,bo_xu_ly,ram,card_do_hoa,bo_mach_chu,man_hinh,ban_phim,chuot,hdd,ssd,trang_thai,ghi_chu',
                    'details.computer.room:id,ma_phong,ten_phong',
                ])
                ->latest('id')
                ->get();

            return response()->json([
                'status' => true,
                'message' => 'Lấy danh sách phiếu nhập máy thành công',
                'error_code' => 200,
                'data' => ComputerImportResource::collection($phieuNhaps),
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

    public function store(ComputerImportRequest $request)
    {
        try {
            $data = $request->validated();

            $phieuNhap = DB::transaction(function () use ($data) {
                $phieuNhap = ComputerImport::create([
                    'ma_phieu_nhap' => $data['ma_phieu_nhap'] ?? $this->generateImportCode(),
                    'ngay_nhap' => $data['ngay_nhap'],
                    'so_luong' => $data['so_luong'],
                    'nha_cung_cap' => $data['nha_cung_cap'] ?? null,
                    'ghi_chu' => $data['ghi_chu'] ?? null,
                ]);

                $phongMay = Room::query()
                    ->lockForUpdate()
                    ->findOrFail($data['ma_phong']);

                $tenPhong = trim($phongMay->ten_phong);
                $tenPhongPattern = preg_quote($tenPhong, '/');
                $soTenMayLonNhatTrongPhong = Computer::query()
                    ->where('ma_phong', $phongMay->id)
                    ->pluck('ten_may')
                    ->map(function ($tenMay) use ($tenPhongPattern) {
                        // Lấy số cuối trong tên máy theo định dạng tên phòng + số máy, ví dụ F7.1-01.
                        if (preg_match('/^'.$tenPhongPattern.'-(\d+)$/u', $tenMay, $matches)) {
                            return (int) $matches[1];
                        }

                        return 0;
                    })
                    ->max() ?? 0;

                $maPhieuNhapNumber = str_replace('PN-', '', $phieuNhap->ma_phieu_nhap);

                for ($i = 1; $i <= (int) $data['so_luong']; $i++) {
                    $soThuTuMay = str_pad((string) $i, 3, '0', STR_PAD_LEFT);
                    $maMay = 'PC-'.$maPhieuNhapNumber.'-'.$soThuTuMay;
                    $tenMay = $tenPhong.'-'.str_pad((string) ($soTenMayLonNhatTrongPhong + $i), 2, '0', STR_PAD_LEFT);

                    if (Computer::where('ma_may', $maMay)->exists()) {
                        throw ValidationException::withMessages([
                            'ma_may' => ["Mã máy {$maMay} đã tồn tại."],
                        ]);
                    }

                    if (
                        Computer::query()
                            ->where('ma_phong', $data['ma_phong'])
                            ->where('ten_may', $tenMay)
                            ->exists()
                    ) {
                        throw ValidationException::withMessages([
                            'ten_may' => ["Tên máy {$tenMay} đã tồn tại trong phòng này."],
                        ]);
                    }

                    $mayTinh = Computer::create([
                        'ma_phong' => $phongMay->id,
                        'ma_may' => $maMay,
                        'ten_may' => $tenMay,
                        'ma_qr' => $this->generateUniqueQrCode($maMay),
                        'bo_xu_ly' => $data['bo_xu_ly'] ?? null,
                        'ram' => $data['ram'] ?? null,
                        'card_do_hoa' => $data['card_do_hoa'] ?? null,
                        'bo_mach_chu' => $data['bo_mach_chu'] ?? null,
                        'man_hinh' => $data['man_hinh'] ?? null,
                        'ban_phim' => $data['ban_phim'] ?? null,
                        'chuot' => $data['chuot'] ?? null,
                        'hdd' => $data['hdd'] ?? null,
                        'ssd' => $data['ssd'] ?? null,
                        'trang_thai' => 'active',
                        'ghi_chu' => $data['ghi_chu'] ?? null,
                    ]);

                    ComputerImportDetail::create([
                        'ma_phieu_nhap' => $phieuNhap->id,
                        'ma_may_tinh' => $mayTinh->id,
                        'ghi_chu' => null,
                    ]);
                }

                return $phieuNhap->load(['details.computer.room']);
            });

            return response()->json([
                'status' => true,
                'message' => 'Tạo phiếu nhập máy thành công',
                'error_code' => 200,
                'data' => new ComputerImportResource($phieuNhap),
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Dữ liệu phiếu nhập không hợp lệ',
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

    public function generateCode()
    {
        try {
            return response()->json([
                'status' => true,
                'message' => 'Tạo mã phiếu nhập thành công',
                'error_code' => 200,
                'data' => [
                    'ma_phieu_nhap' => $this->generateImportCode(),
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

    private function generateImportCode(): string
    {
        for ($attempt = 1; $attempt <= 50; $attempt++) {
            $code = 'PN-'.str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);

            if (! ComputerImport::where('ma_phieu_nhap', $code)->exists()) {
                return $code;
            }
        }

        throw ValidationException::withMessages([
            'ma_phieu_nhap' => ['Không thể tạo mã phiếu nhập, vui lòng thử lại.'],
        ]);
    }

    private function generateUniqueQrCode(string $maMay): string
    {
        $normalizedMaMay = strtoupper(preg_replace('/[^A-Z0-9]+/', '-', $maMay));

        for ($attempt = 1; $attempt <= 50; $attempt++) {
            $code = 'QR-'.$normalizedMaMay.'-'.strtoupper(bin2hex(random_bytes(4)));

            if (! Computer::query()->where('ma_qr', $code)->exists()) {
                return $code;
            }
        }

        throw ValidationException::withMessages([
            'ma_qr' => ['Không thể tạo mã QR duy nhất, vui lòng thử lại.'],
        ]);
    }

    public function show(ComputerImport $computerImport)
    {
        try {

            $computerImport->load([
                'details:id,ma_phieu_nhap,ma_may_tinh,ghi_chu',
                'details.computer:id,ma_phong,ma_may,ten_may,vi_tri,ma_qr,bo_xu_ly,ram,card_do_hoa,bo_mach_chu,man_hinh,ban_phim,chuot,hdd,ssd,trang_thai,ghi_chu',
                'details.computer.room:id,ma_phong,ten_phong',
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Lấy chi tiết phiếu nhập máy thành công',
                'error_code' => 200,
                'data' => new ComputerImportResource($computerImport),
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
