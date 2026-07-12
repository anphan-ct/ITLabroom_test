<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Giữ migration cũ ở dạng tương thích để môi trường đã chạy trước đó không lỗi.
     * Schema hiện tại lưu danh sách máy ở bảng chi_tiet_dieu_chuyen_may.
     */
    public function up(): void
    {
        if (! Schema::hasTable('lich_su_dieu_chuyen_may')) {
            return;
        }
    }

    public function down(): void
    {
        //
    }
};
