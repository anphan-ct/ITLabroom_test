<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('lich_su_dieu_chuyen_may')) {
            return;
        }

        if (Schema::hasColumn('lich_su_dieu_chuyen_may', 'may_tinh_ids')) {
            // Nếu còn dữ liệu cũ trong JSON thì chuyển qua bảng chi tiết trước khi bỏ cột.
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

            Schema::table('lich_su_dieu_chuyen_may', function (Blueprint $table) {
                $table->dropColumn('may_tinh_ids');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('lich_su_dieu_chuyen_may')) {
            return;
        }

        Schema::table('lich_su_dieu_chuyen_may', function (Blueprint $table) {
            if (! Schema::hasColumn('lich_su_dieu_chuyen_may', 'may_tinh_ids')) {
                $table->json('may_tinh_ids')->nullable()->after('id');
            }
        });
    }
};
