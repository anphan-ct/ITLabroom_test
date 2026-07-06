<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Thêm cột người phụ trách vào bảng phiếu bảo trì.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('phieu_bao_tri', function (Blueprint $table) {
            $table->foreignId('ma_nguoi_phu_trach')
                ->nullable()
                ->after('ma_bao_cao_su_co')
                ->constrained('nguoi_dung')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('phieu_bao_tri', function (Blueprint $table) {
            $table->dropForeign(['ma_nguoi_phu_trach']);
            $table->dropColumn('ma_nguoi_phu_trach');
        });
    }
};
