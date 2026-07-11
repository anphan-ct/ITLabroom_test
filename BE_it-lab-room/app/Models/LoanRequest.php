<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoanRequest extends Model
{
    use HasFactory;

    protected $table = 'phieu_muon_may';
    protected $fillable = [
        'ma_phieu_muon',
        'nguoi_muon',
        'ma_giang_vien',
        'ma_phong_ban',
        'ngay_muon',
        'so_luong',
        'ly_do_muon',
        'trang_thai',
        'ghi_chu',
    ];

    protected $casts = [
        'ngay_muon' => 'datetime',
        'so_luong' => 'integer',
    ];

    public function teacher(): BelongsTo { return $this->belongsTo(Teacher::class, 'ma_giang_vien'); }
    public function department(): BelongsTo { return $this->belongsTo(Department::class, 'ma_phong_ban'); }
    public function details() { return $this->hasMany(LoanRequestDetail::class, 'ma_phieu_muon'); }
    public function returnRequests() { return $this->hasMany(ReturnRequest::class, 'ma_phieu_muon'); }

    public function getTrangThaiHienThiAttribute()
    {
        if ($this->relationLoaded('details')) {
            if ($this->details->isEmpty()) return 'Chưa chuyển máy';
            if ($this->details->where('trang_thai_tra', '!=', 'Đã trả')->isNotEmpty()) return 'Chưa trả máy';
            return 'Đã trả máy';
        }

        $details = $this->details()->select('trang_thai_tra')->get();
        if ($details->isEmpty()) return 'Chưa chuyển máy';
        if ($details->where('trang_thai_tra', '!=', 'Đã trả')->isNotEmpty()) return 'Chưa trả máy';
        return 'Đã trả máy';
    }

    public function getSoLuongConLaiAttribute()
    {
        if ($this->relationLoaded('details')) {
            $notReturned = $this->details
                ->where('trang_thai_tra', '!=', 'Đã trả')
                ->count();

            $pendingReturns = $this->returnRequests()
                ->where('trang_thai', \App\Enums\ReturnRequestStatus::PENDING->value)
                ->sum('so_luong');

            return max(0, $notReturned - $pendingReturns);
        }

        if (\Illuminate\Support\Facades\Schema::hasColumn('chi_tiet_phieu_muon_may', 'trang_thai_tra')) {
            $notReturned = $this->details()
                ->where('trang_thai_tra', '!=', 'Đã trả')
                ->count();

            $pendingReturns = $this->returnRequests()
                ->where('trang_thai', \App\Enums\ReturnRequestStatus::PENDING->value)
                ->sum('so_luong');

            return max(0, $notReturned - $pendingReturns);
        }

        $totalReturned = $this->returnRequests()
            ->whereIn('trang_thai', [
                \App\Enums\ReturnRequestStatus::PENDING->value,
                \App\Enums\ReturnRequestStatus::CONFIRMED->value
            ])
            ->sum('so_luong');
            
        return max(0, $this->so_luong - $totalReturned);
    }
}
