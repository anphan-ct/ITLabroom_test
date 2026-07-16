<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('thong_bao', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('ma_nguoi_dung');
            $table->string('tieu_de');
            $table->text('noi_dung');
            $table->string('loai_thong_bao', 50);
            $table->boolean('da_doc')->default(false);
            $table->timestamps();

            $table->foreign('ma_nguoi_dung', 'thong_bao_ma_nguoi_dung_foreign')
                ->references('id')
                ->on('nguoi_dung')
                ->cascadeOnDelete();
            $table->index(['ma_nguoi_dung', 'da_doc', 'created_at'], 'thong_bao_user_read_created_index');
            $table->index('loai_thong_bao', 'thong_bao_loai_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('thong_bao');
    }
};
