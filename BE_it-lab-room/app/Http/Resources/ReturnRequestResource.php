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
            'loan_request'    => $this->whenLoaded('loanRequest', fn () => [
                'id' => $this->loanRequest->id,
                'ma_phieu_muon' => $this->loanRequest->ma_phieu_muon,
                'details' => $this->loanRequest->details->map(fn ($d) => [
                    'id' => $d->id,
                    'ma_may_tinh' => $d->ma_may_tinh,
                    'tinh_trang_khi_muon' => $d->tinh_trang_khi_muon,
                    'ghi_chu' => $d->ghi_chu,
                    'computer' => $d->computer ? [
                        'id' => $d->computer->id,
                        'ma_may' => $d->computer->ma_may,
                        'trang_thai' => $d->computer->trang_thai,
                        'ma_phong' => $d->computer->ma_phong,
                        'room' => $d->computer->room ? [
                            'ten_phong' => $d->computer->room->ten_phong,
                        ] : null,
                    ] : null,
                ]),
            ]),
            'details'         => $this->whenLoaded('details', fn () => $this->details->map(fn ($d) => [
                'id'                   => $d->id,
                'ma_may_tinh'          => $d->ma_may_tinh,
                'ma_may'               => $d->computer?->ma_may,
                'ten_may'              => $d->computer?->ten_may,
                'tinh_trang_khi_tra'   => $d->tinh_trang_khi_tra,
                'ghi_chu'              => $d->ghi_chu,
            ])),
        ];
    }
}
