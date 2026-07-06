<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ComputerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ma_phong' => $this->ma_phong,
            'ma_may' => $this->ma_may,
            'ten_may' => $this->ten_may,
            'vi_tri' => $this->vi_tri,
            'ma_qr' => $this->ma_qr,
            'ma_qr_payload' => $this->ma_qr,
            'bo_xu_ly' => $this->bo_xu_ly,
            'ram' => $this->ram,
            'card_do_hoa' => $this->card_do_hoa,
            'bo_mach_chu' => $this->bo_mach_chu,
            'man_hinh' => $this->man_hinh,
            'ban_phim' => $this->ban_phim,
            'chuot' => $this->chuot,
            'hdd' => $this->hdd,
            'ssd' => $this->ssd,
            'trang_thai' => $this->trang_thai,
            'ghi_chu' => $this->ghi_chu,
            'ten_phong' => $this->whenLoaded('room', fn () => $this->room?->ten_phong),
            'phong' => $this->whenLoaded('room', function () {
                return [
                    'id' => $this->room->id,
                    'ma_phong' => $this->room->ma_phong,
                    'ten_phong' => $this->room->ten_phong,
                ];
            }),
        ];
    }
}
