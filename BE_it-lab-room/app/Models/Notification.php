<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasFactory;

    protected $table = 'thong_bao';
    
    protected $fillable = [
        'ma_nguoi_dung', 
        'tieu_de', 
        'noi_dung', 
        'loai_thong_bao', 
        'da_doc'
    ];

    protected $casts = [
        'da_doc' => 'boolean',
    ];

    // Các hằng số loại thông báo
    const SU_CO_MOI = 'new';
    const SU_CO_DANG_SUA = 'processing';
    const SU_CO_DA_KHAC_PHUC = 'resolved';
    const SU_CO_TU_CHOI = 'rejected';

    public function recipient(): BelongsTo 
    { 
        return $this->belongsTo(User::class, 'ma_nguoi_dung'); 
    }
}
