<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RepairLog extends Model
{
    use HasFactory;

    protected $table = 'nhat_ky_sua_chua';

    protected $fillable = [
        'ma_phieu_bao_tri',
        'ma_may_tinh',
        'ma_thiet_bi',
        'ma_nguoi_sua',
        'thoi_gian_sua',
        'noi_dung_sua',
        'ket_qua',
        'chi_phi',
    ];

    protected $casts = [
        'thoi_gian_sua' => 'datetime',
        'chi_phi'       => 'decimal:2',
    ];

    // Phiếu bảo trì liên quan
    public function maintenanceTicket(): BelongsTo
    {
        return $this->belongsTo(MaintenanceTicket::class, 'ma_phieu_bao_tri');
    }

    // Máy tính được sửa chữa
    public function computer(): BelongsTo
    {
        return $this->belongsTo(Computer::class, 'ma_may_tinh');
    }

    // Thiết bị được sửa chữa
    public function equipment(): BelongsTo
    {
        return $this->belongsTo(Equipment::class, 'ma_thiet_bi');
    }

    // Người thực hiện sửa chữa
    public function repairer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ma_nguoi_sua');
    }
}
