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
        Schema::table('phieu_muon_may', function (Blueprint $table) {
            if (Schema::hasColumn('phieu_muon_may', 'ma_phong')) {
                $table->dropForeign(['ma_phong']);
                $table->dropColumn('ma_phong');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('phieu_muon_may', function (Blueprint $table) {
            if (!Schema::hasColumn('phieu_muon_may', 'ma_phong')) {
                $table->foreignId('ma_phong')->nullable()->constrained('phong_may')->nullOnDelete();
            }
        });
    }
};
