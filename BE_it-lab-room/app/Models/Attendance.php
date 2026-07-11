<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    use HasFactory;

    protected $table = 'diem_danh';
    protected $fillable = ['ma_lich_su_dung', 'ma_sinh_vien', 'ma_lop_hoc_phan', 'ma_may_tinh', 'thoi_gian_check_in', 'trang_thai', 'ghi_chu'];
    protected $casts = ['thoi_gian_check_in' => 'datetime'];

    public function computerLabSchedule(): BelongsTo { return $this->belongsTo(ComputerLabSchedule::class, 'ma_lich_su_dung'); }
    public function student(): BelongsTo { return $this->belongsTo(Student::class, 'ma_sinh_vien'); }
    public function computer(): BelongsTo { return $this->belongsTo(Computer::class, 'ma_may_tinh'); }
}
