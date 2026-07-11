<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('chi_tiet_phieu_muon_may', 'trang_thai_tra')) {
            DB::statement('ALTER TABLE chi_tiet_phieu_muon_may DROP COLUMN trang_thai_tra');
        }

        if (Schema::hasColumn('phieu_tra_may', 'ma_giang_vien')) {
            $foreignKey = DB::table('information_schema.KEY_COLUMN_USAGE')
                ->where('TABLE_SCHEMA', DB::getDatabaseName())
                ->where('TABLE_NAME', 'phieu_tra_may')
                ->where('COLUMN_NAME', 'ma_giang_vien')
                ->whereNotNull('REFERENCED_TABLE_NAME')
                ->value('CONSTRAINT_NAME');

            if ($foreignKey) {
                DB::statement("ALTER TABLE phieu_tra_may DROP FOREIGN KEY `{$foreignKey}`");
            }

            $indexExists = DB::table('information_schema.STATISTICS')
                ->where('TABLE_SCHEMA', DB::getDatabaseName())
                ->where('TABLE_NAME', 'phieu_tra_may')
                ->where('INDEX_NAME', 'ma_giang_vien')
                ->exists();

            if ($indexExists) {
                DB::statement('ALTER TABLE phieu_tra_may DROP INDEX `ma_giang_vien`');
            }

            DB::statement('ALTER TABLE phieu_tra_may DROP COLUMN ma_giang_vien');
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('phieu_tra_may', 'ma_giang_vien')) {
            DB::statement('ALTER TABLE phieu_tra_may ADD ma_giang_vien BIGINT UNSIGNED NULL AFTER ma_phieu_muon');
            DB::statement('ALTER TABLE phieu_tra_may ADD INDEX `ma_giang_vien` (`ma_giang_vien`)');
            DB::statement(
                'ALTER TABLE phieu_tra_may
                ADD CONSTRAINT phieu_tra_may_ibfk_2
                FOREIGN KEY (ma_giang_vien) REFERENCES giang_vien(id)
                ON DELETE SET NULL'
            );
        }

        // Không khôi phục trang_thai_tra vì đã chuyển sang trạng thái động
    }
};
