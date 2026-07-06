<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Đổi điều chuyển máy tính từ 1 máy/lần (ma_may_tinh) sang nhiều máy/lần (may_tinh_ids json).
     */
    public function up(): void
    {
        Schema::table('lich_su_dieu_chuyen_may', function (Blueprint $table) {
            // Chỉ xử lý nếu cột cũ còn tồn tại (DB chưa đổi tay)
            if (Schema::hasColumn('lich_su_dieu_chuyen_may', 'ma_may_tinh')) {
                $table->dropForeign(['ma_may_tinh']);
                $table->dropColumn('ma_may_tinh');
            }

            if (! Schema::hasColumn('lich_su_dieu_chuyen_may', 'may_tinh_ids')) {
                $table->json('may_tinh_ids')->after('id');
            }
        });
    }

    /**
     * Rollback: trả lại cột ma_may_tinh (chỉ phục hồi cấu trúc, không phục hồi dữ liệu cũ).
     */
    public function down(): void
    {
        Schema::table('lich_su_dieu_chuyen_may', function (Blueprint $table) {
            if (Schema::hasColumn('lich_su_dieu_chuyen_may', 'may_tinh_ids')) {
                $table->dropColumn('may_tinh_ids');
            }

            if (! Schema::hasColumn('lich_su_dieu_chuyen_may', 'ma_may_tinh')) {
                $table->foreignId('ma_may_tinh')->nullable()->after('id')
                    ->constrained('may_tinh')->cascadeOnDelete();
            }
        });
    }
};