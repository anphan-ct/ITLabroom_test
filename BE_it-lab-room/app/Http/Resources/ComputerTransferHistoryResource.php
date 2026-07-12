<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ComputerTransferHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                     => $this->id,
            'ma_phong_cu'            => $this->ma_phong_cu,
            'ma_phong_moi'           => $this->ma_phong_moi,
            'ma_nguoi_dieu_chuyen'   => $this->ma_nguoi_dieu_chuyen,
            'thoi_gian_dieu_chuyen'  => $this->thoi_gian_dieu_chuyen,
            'ly_do'                  => $this->ly_do,
            'ghi_chu'                => $this->ghi_chu,
            'created_at'             => $this->created_at,

            // Thông tin danh sách máy tính được điều chuyển lấy từ bảng chi tiết.
            'may_tinh' => $this->whenLoaded('details', function () {
                return $this->details->map(function ($detail) {
                    $computer = $detail->computer;

                    if (! $computer) {
                        return null;
                    }

                    return [
                        'id'      => $computer->id,
                        'ma_may'  => $computer->ma_may,
                        'ten_may' => $computer->ten_may,
                    ];
                })->filter()->values()->toArray();
            }),

            // Thông tin phòng cũ
            'phong_cu' => $this->whenLoaded('oldRoom', function () {
                return [
                    'id'        => $this->oldRoom->id,
                    'ma_phong'  => $this->oldRoom->ma_phong,
                    'ten_phong' => $this->oldRoom->ten_phong,
                ];
            }),

            // Thông tin phòng mới
            'phong_moi' => $this->whenLoaded('newRoom', function () {
                return [
                    'id'        => $this->newRoom->id,
                    'ma_phong'  => $this->newRoom->ma_phong,
                    'ten_phong' => $this->newRoom->ten_phong,
                ];
            }),

            // Thông tin người điều chuyển
            'nguoi_dieu_chuyen' => $this->whenLoaded('transferredBy', function () {
                return [
                    'id'     => $this->transferredBy->id,
                    'ho_ten' => $this->transferredBy->ho_ten,
                ];
            }),
        ];
    }
}
