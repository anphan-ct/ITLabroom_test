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
}
