<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ComputerLabScheduleImportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'success_count' => $this->resource['success_count'],
            'error_count' => $this->resource['error_count'],
            'total' => $this->resource['total'],
            'errors' => $this->resource['errors'],
            'items' => ComputerLabScheduleResource::collection(
                $this->resource['items']
            ),
        ];
    }
}
