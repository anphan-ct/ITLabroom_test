<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MaintenanceTicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'ma_bao_cao_su_co'  => $this->ma_bao_cao_su_co,
            'ma_nguoi_phu_trach' => $this->ma_nguoi_phu_trach,
            'loai_bao_tri'      => $this->loai_bao_tri,
            'ngay_bat_dau'      => $this->ngay_bat_dau?->format('Y-m-d'),
            'ngay_ket_thuc'     => $this->ngay_ket_thuc?->format('Y-m-d'),
            'cach_xu_ly'        => $this->cach_xu_ly,
            'chi_phi'           => $this->chi_phi,
            'trang_thai'        => $this->trang_thai,
            'created_at'        => $this->created_at,
            'updated_at'        => $this->updated_at,

            // Thông tin báo cáo sự cố liên quan
            'bao_cao_su_co' => $this->whenLoaded('incidentReport', function () {
                return $this->incidentReport ? [
                    'id'       => $this->incidentReport->id,
                    'tieu_de'  => $this->incidentReport->tieu_de,
                    'trang_thai' => $this->incidentReport->trang_thai,
                ] : null;
            }),

            // Thông tin người phụ trách
            'nguoi_phu_trach' => $this->whenLoaded('assignee', function () {
                return $this->assignee ? [
                    'id'     => $this->assignee->id,
                    'ho_ten' => $this->assignee->ho_ten,
                ] : null;
            }),
        ];
    }
}
