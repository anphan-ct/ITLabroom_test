<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LoanRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'ma_phieu_muon'   => $this->ma_phieu_muon,
            'ten_giang_vien'  => $this->teacher?->user?->ho_ten,
            'ma_phong_ban'    => $this->department?->ten_phong_ban,
            'ngay_muon'       => $this->ngay_muon,
            'so_luong'        => $this->so_luong,
            'ly_do_muon'      => $this->ly_do_muon,
            'trang_thai'      => $this->trang_thai,
            'details'         => $this->whenLoaded('details', fn () => $this->details->map(fn ($d) => [
                'id'                   => $d->id,
                'ma_may_tinh'          => $d->ma_may_tinh,
                'ten_may'              => $d->computer?->ten_may,
                'tinh_trang_khi_muon'  => $d->tinh_trang_khi_muon,
                'ghi_chu'              => $d->ghi_chu,
            ])),
        ];
    }
}
