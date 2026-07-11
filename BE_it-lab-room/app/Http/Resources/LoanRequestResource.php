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
            'nguoi_muon'      => $this->nguoi_muon,
            'ten_giang_vien'  => $this->nguoi_muon,
            'ma_phong_ban'    => $this->department?->ten_phong_ban,
            'ngay_muon'       => $this->ngay_muon,
            'so_luong'        => $this->so_luong,
            'so_luong_con_lai'=> $this->so_luong_con_lai,
            'ly_do_muon'      => $this->ly_do_muon,
            'trang_thai'      => $this->trang_thai,
            'trang_thai_hien_thi' => $this->trang_thai_hien_thi,
            'details'         => $this->whenLoaded('details', function () {
                $returnedIds = $this->getReturnedComputerIds();
                return $this->details->map(fn ($d) => [
                    'id'                   => $d->id,
                    'ma_may_tinh'          => $d->ma_may_tinh,
                    'ma_may'               => $d->computer?->ma_may,
                    'ten_may'              => $d->computer?->ten_may,
                    'tinh_trang_khi_muon'  => $d->tinh_trang_khi_muon,
                    'ghi_chu'              => $d->ghi_chu,
                    'da_tra'               => $returnedIds->contains($d->ma_may_tinh),
                ]);
            }),
        ];
    }
}
