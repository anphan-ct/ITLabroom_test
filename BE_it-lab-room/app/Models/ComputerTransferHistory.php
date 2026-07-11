<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ComputerTransferHistory extends Model
{
    use HasFactory;

    protected $table = 'lich_su_dieu_chuyen_may';

    protected $fillable = [
        'ma_phong_cu',
        'ma_phong_moi',
        'ma_nguoi_dieu_chuyen',
        'thoi_gian_dieu_chuyen',
        'ly_do',
        'ghi_chu',
    ];

    protected $casts = [
        'thoi_gian_dieu_chuyen' => 'datetime',
    ];

    // Quan hệ: chi tiết điều chuyển máy
    public function details(): HasMany
    {
        return $this->hasMany(ComputerTransferDetail::class, 'ma_lich_su_dieu_chuyen');
    }

    // Quan hệ: phòng cũ (trước khi điều chuyển)
    public function oldRoom(): BelongsTo
    {
        return $this->belongsTo(Room::class, 'ma_phong_cu');
    }

    // Quan hệ: phòng mới (sau khi điều chuyển)
    public function newRoom(): BelongsTo
    {
        return $this->belongsTo(Room::class, 'ma_phong_moi');
    }

    // Quan hệ: người thực hiện điều chuyển (admin)
    public function transferredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ma_nguoi_dieu_chuyen');
    }
}
