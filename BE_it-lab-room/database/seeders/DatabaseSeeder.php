<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use App\Models\Department;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed dữ liệu tài khoản test đăng nhập cho admin, sinh viên và giảng viên.
     */
    public function run(): void
    {
        $password = Hash::make('Password@123');

        // Tạo role với ID cố định để khớp logic validate/xử lý người dùng.
        $adminRole = $this->upsertRole(1, 'admin', 'Quản trị viên hệ thống');
        $studentRole = $this->upsertRole(2, 'student', 'Sinh viên');
        $teacherRole = $this->upsertRole(3, 'teacher', 'Giảng viên');
        $this->upsertRole(4, 'technician', 'Kỹ thuật viên');

        $this->call(DepartmentSeeder::class);

        $admin = User::query()->updateOrCreate(
            ['email' => 'admin@itlab.test'],
            [
                'ma_vai_tro' => $adminRole->id,
                'ho_ten' => 'Admin IT Lab',
                'mat_khau' => $password,
                'so_dien_thoai' => '0900000001',
                'gioi_tinh' => 'Nam',
                'ngay_sinh' => '1990-01-01',
                'trang_thai' => 1,
            ]
        );

        $teacherUser = User::query()->updateOrCreate(
            ['email' => 'teacher@itlab.test'],
            [
                'ma_vai_tro' => $teacherRole->id,
                'ho_ten' => 'Giảng viên IT Lab',
                'mat_khau' => $password,
                'so_dien_thoai' => '0900000002',
                'gioi_tinh' => 'Nữ',
                'ngay_sinh' => '1988-05-10',
                'trang_thai' => 1,
            ]
        );

        $department = Department::query()->updateOrCreate(
            ['ma_phong_ban' => 'CNTT'],
            [
                'ten_phong_ban' => 'Khoa Công nghệ thông tin',
                'trang_thai' => 'active',
                'mo_ta' => 'Đơn vị công tác của giảng viên test',
            ]
        );

        $teacher = Teacher::query()->updateOrCreate(
            ['ma_nguoi_dung' => $teacherUser->id],
            [
                'ma_giang_vien' => 'GVTEST001',
                'ma_phong_ban' => $department->id,
            ]
        );

        $class = SchoolClass::query()->updateOrCreate(
            ['ma_lop' => 'CTK_TEST_01'],
            [
                'nien_khoa' => '2022-2026',
                'chuyen_nganh' => 'Công nghệ thông tin',
                'ma_giang_vien' => $teacher->id,
            ]
        );

        $studentUser = User::query()->updateOrCreate(
            ['email' => 'student@itlab.test'],
            [
                'ma_vai_tro' => $studentRole->id,
                'ho_ten' => 'Sinh viên IT Lab',
                'mat_khau' => $password,
                'so_dien_thoai' => '0900000003',
                'gioi_tinh' => 'Nam',
                'ngay_sinh' => '2004-09-15',
                'trang_thai' => 1,
            ]
        );

        Student::query()->updateOrCreate(
            ['ma_nguoi_dung' => $studentUser->id],
            [
                'ma_lop' => $class->id,
                'ma_sinh_vien' => 'SVTEST001',
                'nien_khoa' => '2022-2026',
            ]
        );

        $classMonitorUser = User::query()->updateOrCreate(
            ['email' => 'monitor@itlab.test'],
            [
                'ma_vai_tro' => $studentRole->id,
                'ho_ten' => 'Lớp trưởng IT Lab',
                'mat_khau' => $password,
                'so_dien_thoai' => '0900000004',
                'gioi_tinh' => 'Nữ',
                'ngay_sinh' => '2004-10-20',
                'trang_thai' => 1,
            ]
        );

        Student::query()->updateOrCreate(
            ['ma_nguoi_dung' => $classMonitorUser->id],
            [
                'ma_lop' => $class->id,
                'ma_sinh_vien' => 'SVTEST002',
                'nien_khoa' => '2022-2026',
            ]
        );

        // Tạo dữ liệu nền để màn quản trị có thể thêm lịch sử dụng phòng máy.
        $this->call(ComputerLabScheduleSeeder::class);
        $this->call(AdditionalAcademicDataSeeder::class);
        $this->call(CourseSectionStudentSeeder::class);

        // Xóa token cũ của tài khoản test để tránh token tồn đọng sau khi seed lại.
        $admin->tokens()->delete();
        $teacherUser->tokens()->delete();
        $studentUser->tokens()->delete();
        $classMonitorUser->tokens()->delete();
    }

    private function upsertRole(int $id, string $name, string $description): Role
    {
        DB::table('vai_tro')->updateOrInsert(
            ['id' => $id],
            [
                'ten_vai_tro' => $name,
                'mo_ta' => $description,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        return Role::query()->findOrFail($id);
    }
}
