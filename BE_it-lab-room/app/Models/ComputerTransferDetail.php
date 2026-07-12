<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ComputerTransferDetail extends Model
{
    use HasFactory;

    protected $table = 'chi_tiet_dieu_chuyen_may';

    protected $fillable = [
        'ma_lich_su_dieu_chuyen',
        'ma_may_tinh',
        'ghi_chu',
    ];

    public function transferHistory(): BelongsTo
    {
        return $this->belongsTo(ComputerTransferHistory::class, 'ma_lich_su_dieu_chuyen');
    }

    public function computer(): BelongsTo
    {
        return $this->belongsTo(Computer::class, 'ma_may_tinh');
    }
}
