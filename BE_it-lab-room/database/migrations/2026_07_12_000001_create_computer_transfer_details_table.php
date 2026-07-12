<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('chi_tiet_dieu_chuyen_may')) {
            Schema::create('chi_tiet_dieu_chuyen_may', function (Blueprint $table) {
                $table->id();
                $table->foreignId('ma_lich_su_dieu_chuyen')
                    ->constrained('lich_su_dieu_chuyen_may')
                    ->cascadeOnDelete();
                $table->foreignId('ma_may_tinh')
                    ->constrained('may_tinh')
                    ->restrictOnDelete();
                $table->text('ghi_chu')->nullable();
                $table->timestamps();

                $table->unique(['ma_lich_su_dieu_chuyen', 'ma_may_tinh'], 'chi_tiet_dieu_chuyen_unique');
            });
        }

        if (Schema::hasColumn('lich_su_dieu_chuyen_may', 'may_tinh_ids')) {
            // Đồng bộ dữ liệu cũ từ cột JSON sang bảng chi tiết nếu môi trường chưa tách dữ liệu.
            DB::table('lich_su_dieu_chuyen_may')
                ->select(['id', 'may_tinh_ids', 'ghi_chu', 'created_at', 'updated_at'])
                ->orderBy('id')
                ->chunkById(100, function ($transfers) {
                    foreach ($transfers as $transfer) {
                        $computerIds = json_decode($transfer->may_tinh_ids ?? '[]', true);

                        if (! is_array($computerIds)) {
                            continue;
                        }

                        foreach ($computerIds as $computerId) {
                            DB::table('chi_tiet_dieu_chuyen_may')->updateOrInsert(
                                [
                                    'ma_lich_su_dieu_chuyen' => $transfer->id,
                                    'ma_may_tinh' => (int) $computerId,
                                ],
                                [
                                    'ghi_chu' => $transfer->ghi_chu,
                                    'created_at' => $transfer->created_at,
                                    'updated_at' => $transfer->updated_at,
                                ]
                            );
                        }
                    }
                });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('chi_tiet_dieu_chuyen_may');
    }
};
