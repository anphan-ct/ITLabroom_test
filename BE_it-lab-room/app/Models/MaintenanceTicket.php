<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MaintenanceTicket extends Model
{
    use HasFactory;

    protected $table = 'phieu_bao_tri';
    protected $fillable = [
        'ma_bao_cao_su_co',
        'ma_nguoi_phu_trach',
        'loai_bao_tri',
        'ngay_bat_dau',
        'ngay_ket_thuc',
        'cach_xu_ly',
        'chi_phi',
        'trang_thai',
    ];
    protected $casts = ['ngay_bat_dau' => 'date', 'ngay_ket_thuc' => 'date', 'chi_phi' => 'decimal:2'];

    // Báo cáo sự cố liên quan
    public function incidentReport(): BelongsTo { return $this->belongsTo(IncidentReport::class, 'ma_bao_cao_su_co'); }

    // Người phụ trách (giảng viên/kỹ thuật viên)
    public function assignee(): BelongsTo { return $this->belongsTo(User::class, 'ma_nguoi_phu_trach'); }

    // Danh sách nhật ký sửa chữa thuộc phiếu này
    public function repairLogs(): HasMany { return $this->hasMany(RepairLog::class, 'ma_phieu_bao_tri'); }
}
