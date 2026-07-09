<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RepairLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'ma_phieu_bao_tri'  => $this->ma_phieu_bao_tri,
            'ma_may_tinh'       => $this->ma_may_tinh,
            'ma_thiet_bi'       => $this->ma_thiet_bi,
            'ma_nguoi_sua'      => $this->ma_nguoi_sua,
            'thoi_gian_sua'     => $this->thoi_gian_sua,
            'noi_dung_sua'      => $this->noi_dung_sua,
            'ket_qua'           => $this->ket_qua,
            'chi_phi'           => $this->chi_phi,
            'created_at'        => $this->created_at,
            'updated_at'        => $this->updated_at,

            // Thông tin phiếu bảo trì
            'phieu_bao_tri' => $this->whenLoaded('maintenanceTicket', function () {
                return $this->maintenanceTicket ? [
                    'id'        => $this->maintenanceTicket->id,
                    'trang_thai' => $this->maintenanceTicket->trang_thai,
                ] : null;
            }),

            // Thông tin máy tính
            'may_tinh' => $this->whenLoaded('computer', function () {
                return $this->computer ? [
                    'id'      => $this->computer->id,
                    'ma_may'  => $this->computer->ma_may,
                    'ten_may' => $this->computer->ten_may,
                ] : null;
            }),

            // Thông tin thiết bị
            'thiet_bi' => $this->whenLoaded('equipment', function () {
                return $this->equipment ? [
                    'id'           => $this->equipment->id,
                    'ten_thiet_bi' => $this->equipment->ten_thiet_bi,
                ] : null;
            }),

            // Thông tin người sửa
            'nguoi_sua' => $this->whenLoaded('repairer', function () {
                return $this->repairer ? [
                    'id'     => $this->repairer->id,
                    'ho_ten' => $this->repairer->ho_ten,
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
