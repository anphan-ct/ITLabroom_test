<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Collection;

class LoanRequest extends Model
{
    use HasFactory;

    protected $table = 'phieu_muon_may';
    protected $fillable = [
        'ma_phieu_muon',
        'nguoi_muon',
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

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'ma_phong_ban');
    }
    public function details()
    {
        return $this->hasMany(LoanRequestDetail::class, 'ma_phieu_muon');
    }
    public function returnRequests()
    {
        return $this->hasMany(ReturnRequest::class, 'ma_phieu_muon');
    }

    protected ?Collection $returnedComputerIdsCache = null;

    public function getReturnedComputerIds()
    {
        if ($this->returnedComputerIdsCache === null) {
            $this->returnedComputerIdsCache = \App\Models\ReturnRequestDetail::whereIn('ma_phieu_tra', function ($q) {
                $q->select('id')->from('phieu_tra_may')
                    ->where('ma_phieu_muon', $this->id)
                    ->where('trang_thai', \App\Enums\ReturnRequestStatus::CONFIRMED->value);
            })->pluck('ma_may_tinh');
        }

        return $this->returnedComputerIdsCache;
    }

    public function getTrangThaiHienThiAttribute()
    {
        $loanComputerIds = $this->relationLoaded('details')
            ? $this->details->pluck('ma_may_tinh')
            : $this->details()->pluck('ma_may_tinh');

        if ($loanComputerIds->isEmpty()) {
            return 'Chưa chuyển máy';
        }

        $returnedIds = $this->getReturnedComputerIds();

        if ($loanComputerIds->diff($returnedIds)->isEmpty()) {
            return 'Đã trả máy';
        }

        return 'Chưa trả máy';
    }

    public function getSoLuongConLaiAttribute()
    {
        $loanComputerIds = $this->relationLoaded('details')
            ? $this->details->pluck('ma_may_tinh')
            : $this->details()->pluck('ma_may_tinh');

        $returnedIds = $this->getReturnedComputerIds();
        $notReturned = $loanComputerIds->diff($returnedIds)->count();

        $pendingReturns = $this->returnRequests()
            ->where('trang_thai', \App\Enums\ReturnRequestStatus::PENDING->value)
            ->sum('so_luong');

        return max(0, $notReturned - $pendingReturns);
    }
}
