<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReturnRequestDetail extends Model
{
    use HasFactory;

    protected $table = 'chi_tiet_phieu_tra_may';
    protected $fillable = [
        'ma_phieu_tra',
        'ma_may_tinh',
        'tinh_trang_khi_tra',
        'ghi_chu',
    ];

    public function returnRequest(): BelongsTo
    {
        return $this->belongsTo(ReturnRequest::class, 'ma_phieu_tra');
    }

    public function computer(): BelongsTo
    {
        return $this->belongsTo(Computer::class, 'ma_may_tinh');
    }
}
