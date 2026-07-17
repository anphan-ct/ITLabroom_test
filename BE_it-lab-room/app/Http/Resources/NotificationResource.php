<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Carbon\Carbon;

class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'tieu_de'        => $this->tieu_de,
            'noi_dung'       => $this->noi_dung,
            'loai_thong_bao' => $this->loai_thong_bao,
            'da_doc'         => $this->da_doc,
            'created_at'     => $this->created_at ? Carbon::parse($this->created_at)->format('d/m/Y H:i') : null,
        ];
    }
}
