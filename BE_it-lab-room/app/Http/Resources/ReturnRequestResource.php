<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReturnRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'ma_phieu_tra'    => $this->ma_phieu_tra,
            'ma_phieu_muon'   => $this->loanRequest?->ma_phieu_muon,
            'ten_giang_vien'  => $this->teacher?->user?->ho_ten,
            'thoi_gian_tra'   => $this->thoi_gian_tra,
            'so_luong'        => $this->so_luong,
            'ghi_chu'         => $this->ghi_chu,
            'trang_thai'      => $this->trang_thai,
            'details'         => $this->whenLoaded('details', fn () => $this->details->map(fn ($d) => [
                'id'                   => $d->id,
                'ma_may_tinh'          => $d->ma_may_tinh,
                'ten_may'              => $d->computer?->ten_may,
                'tinh_trang_khi_tra'   => $d->tinh_trang_khi_tra,
            ])),
        ];
    }
}
