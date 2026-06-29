<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IncidentReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'ma_nguoi_bao_cao' => $this->ma_nguoi_bao_cao,
            'ma_may_tinh'   => $this->ma_may_tinh,
            'ma_thiet_bi'   => $this->ma_thiet_bi,
            'loai_su_co'    => $this->loai_su_co,
            'tieu_de'       => $this->tieu_de,
            'mo_ta'         => $this->mo_ta,
            'muc_do'        => $this->muc_do,
            'trang_thai'    => $this->trang_thai,
            'created_at'    => $this->created_at,
            'updated_at'    => $this->updated_at,

            // Thông tin người báo cáo
            'nguoi_bao_cao' => $this->whenLoaded('reporter', function () {
                return [
                    'id'     => $this->reporter->id,
                    'ho_ten' => $this->reporter->ho_ten,
                ];
            }),

            // Thông tin máy tính liên quan
            'may_tinh' => $this->whenLoaded('computer', function () {
                return $this->computer ? [
                    'id'      => $this->computer->id,
                    'ma_may'  => $this->computer->ma_may,
                    'ten_may' => $this->computer->ten_may,
                ] : null;
            }),

            // Thông tin thiết bị liên quan
            'thiet_bi' => $this->whenLoaded('equipment', function () {
                return $this->equipment ? [
                    'id'          => $this->equipment->id,
                    'ten_thiet_bi' => $this->equipment->ten_thiet_bi,
                ] : null;
            }),

            // Thông tin phòng (suy ra từ máy tính hoặc thiết bị)
            'phong' => $this->getPhong(),
        ];
    }

    /**
     * Suy ra thông tin phòng từ máy tính hoặc thiết bị.
     */
    private function getPhong(): ?array
    {
        // Ưu tiên lấy phòng từ máy tính
        if ($this->relationLoaded('computer') && $this->computer && $this->computer->relationLoaded('room') && $this->computer->room) {
            return [
                'id'        => $this->computer->room->id,
                'ma_phong'  => $this->computer->room->ma_phong,
                'ten_phong' => $this->computer->room->ten_phong,
            ];
        }

        // Nếu không có máy tính, lấy từ thiết bị
        if ($this->relationLoaded('equipment') && $this->equipment && $this->equipment->relationLoaded('room') && $this->equipment->room) {
            return [
                'id'        => $this->equipment->room->id,
                'ma_phong'  => $this->equipment->room->ma_phong,
                'ten_phong' => $this->equipment->room->ten_phong,
            ];
        }

        return null;
    }
}
