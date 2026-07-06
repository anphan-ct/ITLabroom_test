<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReturnRequest extends Model
{
    use HasFactory;

    protected $table = 'phieu_tra_may';
    protected $fillable = [
        'ma_phieu_tra',
        'ma_phieu_muon',
        'ma_giang_vien',
        'thoi_gian_tra',
        'so_luong',
        'trang_thai',
        'ghi_chu',
    ];

    protected $casts = [
        'thoi_gian_tra' => 'datetime',
        'so_luong' => 'integer',
    ];

    public function loanRequest(): BelongsTo
    {
        return $this->belongsTo(LoanRequest::class, 'ma_phieu_muon');
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'ma_giang_vien');
    }

    public function details(): HasMany
    {
        return $this->hasMany(ReturnRequestDetail::class, 'ma_phieu_tra');
    }
}
