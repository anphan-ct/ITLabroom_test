<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ComputerImportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ma_phieu_nhap' => $this->ma_phieu_nhap,
            'ngay_nhap' => $this->ngay_nhap?->format('Y-m-d'),
            'so_luong' => $this->so_luong,
            'nha_cung_cap' => $this->nha_cung_cap,
            'ghi_chu' => $this->ghi_chu,
            'chi_tiet' => $this->whenLoaded('details', function () {
                return $this->details->map(function ($detail) {
                    return [
                        'id' => $detail->id,
                        'ma_phieu_nhap' => $detail->ma_phieu_nhap,
                        'ma_may_tinh' => $detail->ma_may_tinh,
                        'ghi_chu' => $detail->ghi_chu,
                        'may_tinh' => $detail->relationLoaded('computer') && $detail->computer
                            ? [
                                'id' => $detail->computer->id,
                                'ma_phong' => $detail->computer->ma_phong,
                                'ma_may' => $detail->computer->ma_may,
                                'ten_may' => $detail->computer->ten_may,
                                'vi_tri' => $detail->computer->vi_tri,
                                'ma_qr' => $detail->computer->ma_qr,
                                'bo_xu_ly' => $detail->computer->bo_xu_ly,
                                'ram' => $detail->computer->ram,
                                'card_do_hoa' => $detail->computer->card_do_hoa,
                                'bo_mach_chu' => $detail->computer->bo_mach_chu,
                                'man_hinh' => $detail->computer->man_hinh,
                                'ban_phim' => $detail->computer->ban_phim,
                                'chuot' => $detail->computer->chuot,
                                'hdd' => $detail->computer->hdd,
                                'ssd' => $detail->computer->ssd,
                                'trang_thai' => $detail->computer->trang_thai,
                                'ghi_chu' => $detail->computer->ghi_chu,
                                'phong' => $detail->computer->relationLoaded('room') && $detail->computer->room
                                    ? [
                                        'id' => $detail->computer->room->id,
                                        'ma_phong' => $detail->computer->room->ma_phong,
                                        'ten_phong' => $detail->computer->room->ten_phong,
                                    ]
                                    : null,
                            ]
                            : null,
                    ];
                });
            }),
        ];
    }
}
