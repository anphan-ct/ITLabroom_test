<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Computer extends Model
{
    use HasFactory;

    protected $table = 'may_tinh';
    protected $fillable = [
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
    ];

    public function room(): BelongsTo { return $this->belongsTo(Room::class, 'ma_phong'); }
    public function incidentReports(): HasMany { return $this->hasMany(IncidentReport::class, 'ma_may_tinh'); }
    public function attendanceRecords(): HasMany { return $this->hasMany(Attendance::class, 'ma_may_tinh'); }
    public function transferDetails(): HasMany { return $this->hasMany(ComputerTransferDetail::class, 'ma_may_tinh'); }

    /**
     * Sinh danh sách tên máy tự động theo đúng phòng, dạng "{Tên phòng}-{Số thứ tự}", zero-pad 2 chữ số.
     * Số thứ tự tiếp nối từ số lớn nhất hiện có trong phòng (không phụ thuộc vi_tri).
     * Dùng chung cho chức năng Nhập máy và Điều chuyển máy.
     *
     * @param int $roomId ID phòng cần sinh tên máy trong đó
     * @param string $tenPhong Tên phòng (dùng làm tiền tố)
     * @param int $count Số lượng tên cần sinh liên tiếp (dùng khi nhập/chuyển nhiều máy cùng lúc)
     * @return array<int, string> Danh sách tên máy đã sinh, theo đúng thứ tự
     */
    public static function generateTenMaySequence(int $roomId, string $tenPhong, int $count): array
    {
        $tenPhong = trim($tenPhong);
        $tenPhongPattern = preg_quote($tenPhong, '/');

        $soTenMayLonNhatTrongPhong = static::query()
            ->where('ma_phong', $roomId)
            ->pluck('ten_may')
            ->map(function ($tenMay) use ($tenPhongPattern) {
                if (preg_match('/^'.$tenPhongPattern.'-(\d+)$/u', $tenMay, $matches)) {
                    return (int) $matches[1];
                }
                return 0;
            })
            ->max() ?? 0;

        $result = [];
        for ($i = 1; $i <= $count; $i++) {
            $result[] = $tenPhong.'-'.str_pad((string) ($soTenMayLonNhatTrongPhong + $i), 2, '0', STR_PAD_LEFT);
        }

        return $result;
    }
}
