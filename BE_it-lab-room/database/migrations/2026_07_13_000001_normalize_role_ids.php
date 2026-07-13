<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $roles = [
            1 => ['ten_vai_tro' => 'admin', 'mo_ta' => 'Quản trị viên hệ thống'],
            2 => ['ten_vai_tro' => 'student', 'mo_ta' => 'Sinh viên'],
            3 => ['ten_vai_tro' => 'teacher', 'mo_ta' => 'Giảng viên'],
            4 => ['ten_vai_tro' => 'technician', 'mo_ta' => 'Kỹ thuật viên'],
        ];

        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        try {
            foreach ($roles as $targetId => $roleData) {
                $this->moveRoleToFixedId($targetId, $roleData);
            }

            DB::statement('ALTER TABLE vai_tro AUTO_INCREMENT = 5');
        } finally {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }
    }

    public function down(): void
    {
        // Không rollback ID vai trò để tránh làm lệch khóa ngoại nguoi_dung.ma_vai_tro.
    }

    private function moveRoleToFixedId(int $targetId, array $roleData): void
    {
        $now = now();
        $role = DB::table('vai_tro')
            ->where('ten_vai_tro', $roleData['ten_vai_tro'])
            ->first();

        if (! $role) {
            DB::table('vai_tro')->insert([
                'id' => $targetId,
                'ten_vai_tro' => $roleData['ten_vai_tro'],
                'mo_ta' => $roleData['mo_ta'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            return;
        }

        if ((int) $role->id === $targetId) {
            DB::table('vai_tro')
                ->where('id', $targetId)
                ->update([
                    'mo_ta' => $roleData['mo_ta'],
                    'updated_at' => $now,
                ]);

            return;
        }

        $targetRole = DB::table('vai_tro')->where('id', $targetId)->first();

        if ($targetRole && $targetRole->ten_vai_tro !== $roleData['ten_vai_tro']) {
            $temporaryId = $this->nextTemporaryRoleId();

            // Dời role đang chiếm ID chuẩn sang ID tạm, rồi cập nhật user liên quan.
            DB::table('nguoi_dung')
                ->where('ma_vai_tro', $targetId)
                ->update(['ma_vai_tro' => $temporaryId]);

            DB::table('vai_tro')
                ->where('id', $targetId)
                ->update(['id' => $temporaryId, 'updated_at' => $now]);
        }

        // Dời role chuẩn về đúng ID và giữ đồng bộ khóa ngoại người dùng.
        DB::table('nguoi_dung')
            ->where('ma_vai_tro', $role->id)
            ->update(['ma_vai_tro' => $targetId]);

        DB::table('vai_tro')
            ->where('id', $role->id)
            ->update([
                'id' => $targetId,
                'mo_ta' => $roleData['mo_ta'],
                'updated_at' => $now,
            ]);
    }

    private function nextTemporaryRoleId(): int
    {
        $maxId = (int) DB::table('vai_tro')->max('id');

        return max($maxId + 100, 1000);
    }
};
