<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademicYear extends Model
{
    use HasFactory;

    protected $table = 'nam_hoc';

    protected $fillable = [
        'ten_nam_hoc',
        'ngay_bat_dau',
        'ngay_ket_thuc',
        'trang_thai',
    ];

    protected $casts = [
        'ngay_bat_dau' => 'date',
        'ngay_ket_thuc' => 'date',
    ];

    public function weeks(): HasMany
    {
        return $this->hasMany(Week::class, 'ma_nam_hoc');
    }

    public function courseSections(): HasMany
    {
        return $this->hasMany(CourseSection::class, 'ma_nam_hoc');
    }

    // public function roomBookingRequests(): HasMany
    // {
    //     return $this->hasMany(RoomBooking::class, 'ma_nam_hoc');
    // }
}
