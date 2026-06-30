<?php

namespace App\Enums;

enum MachineCondition: string
{
    case TOT = 'tot';
    case HU_NHE = 'hu_nhe';
    case HU_NANG = 'hu_nang';

    public function label(): string
    {
        return match($this) {
            self::TOT => 'Tốt',
            self::HU_NHE => 'Hư nhẹ',
            self::HU_NANG => 'Hư nặng',
        };
    }
}
