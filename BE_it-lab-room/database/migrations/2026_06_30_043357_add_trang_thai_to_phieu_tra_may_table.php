<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('phieu_tra_may', function (Blueprint $table) {
            if (! Schema::hasColumn('phieu_tra_may', 'trang_thai')) {
                $table->string('trang_thai', 50)->default('pending')->after('so_luong');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('phieu_tra_may', function (Blueprint $table) {
            if (Schema::hasColumn('phieu_tra_may', 'trang_thai')) {
                $table->dropColumn('trang_thai');
            }
        });
    }
};
