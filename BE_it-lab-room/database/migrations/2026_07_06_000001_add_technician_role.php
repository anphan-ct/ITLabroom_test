<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('vai_tro')->updateOrInsert(
            ['ten_vai_tro' => 'technician'],
            [
                'mo_ta' => 'Kỹ thuật viên',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    public function down(): void
    {
        $role = DB::table('vai_tro')->where('ten_vai_tro', 'technician')->first();

        if ($role && ! DB::table('nguoi_dung')->where('ma_vai_tro', $role->id)->exists()) {
            DB::table('vai_tro')->where('id', $role->id)->delete();
        }
    }
};
