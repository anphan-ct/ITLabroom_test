<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    /**
     * Tạo dữ liệu danh mục phòng ban/khoa dùng khi gán tài khoản giảng viên.
     */
    public function run(): void
    {
        $departments = [
            [
                'ma_phong_ban' => 'CNTT',
                'ten_phong_ban' => 'Khoa Công nghệ thông tin',
                'mo_ta' => 'Đơn vị quản lý giảng viên công nghệ thông tin',
            ],
            [
                'ma_phong_ban' => 'DT',
                'ten_phong_ban' => 'Phòng Đào tạo',
                'mo_ta' => 'Đơn vị quản lý đào tạo',
            ],
            [
                'ma_phong_ban' => 'KT',
                'ten_phong_ban' => 'Khoa Kinh tế',
                'mo_ta' => 'Đơn vị quản lý giảng viên khối kinh tế',
            ],
            [
                'ma_phong_ban' => 'CK',
                'ten_phong_ban' => 'Khoa Cơ khí',
                'mo_ta' => 'Đơn vị quản lý giảng viên cơ khí',
            ],
            [
                'ma_phong_ban' => 'DDT',
                'ten_phong_ban' => 'Khoa Điện - Điện tử',
                'mo_ta' => 'Đơn vị quản lý giảng viên điện, điện tử',
            ],
            [
                'ma_phong_ban' => 'QTKD',
                'ten_phong_ban' => 'Khoa Quản trị kinh doanh',
                'mo_ta' => 'Đơn vị quản lý giảng viên quản trị kinh doanh',
            ],
        ];

        foreach ($departments as $department) {
            Department::query()->updateOrCreate(
                ['ma_phong_ban' => $department['ma_phong_ban']],
                [
                    'ten_phong_ban' => $department['ten_phong_ban'],
                    'trang_thai' => 'active',
                    'mo_ta' => $department['mo_ta'],
                ]
            );
        }
    }
}
