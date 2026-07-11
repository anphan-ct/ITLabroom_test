<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Đồng bộ vị trí máy từ số cuối của tên máy, ví dụ F7.1-01 => vị trí 01.
        DB::statement("
            UPDATE may_tinh
            SET vi_tri = LPAD(REGEXP_SUBSTR(ten_may, '[0-9]+$'), 2, '0')
            WHERE ten_may REGEXP '[0-9]+$'
        ");
    }

    public function down(): void
    {
        // Không rollback dữ liệu vị trí vì không biết chính xác giá trị cũ sau khi đồng bộ.
    }
};
