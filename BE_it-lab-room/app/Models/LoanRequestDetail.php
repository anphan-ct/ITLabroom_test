<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoanRequestDetail extends Model
{
    use HasFactory;

    protected $table = 'chi_tiet_phieu_muon_may';
    protected $fillable = [
        'ma_phieu_muon',
        'ma_may_tinh',
        'tinh_trang_khi_muon',
        'ghi_chu',
    ];

    public function loanRequest(): BelongsTo
    {
        return $this->belongsTo(LoanRequest::class, 'ma_phieu_muon');
    }

    public function computer(): BelongsTo
    {
        return $this->belongsTo(Computer::class, 'ma_may_tinh');
    }
}
