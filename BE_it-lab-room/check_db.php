<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$columns = \Illuminate\Support\Facades\DB::select('SHOW COLUMNS FROM phieu_bao_tri LIKE \'trang_thai\'');
echo 'phieu_bao_tri: ' . $columns[0]->Type . "\n";
$columns2 = \Illuminate\Support\Facades\DB::select('SHOW COLUMNS FROM bao_cao_su_co LIKE \'trang_thai\'');
echo 'bao_cao_su_co: ' . $columns2[0]->Type . "\n";
$columns3 = \Illuminate\Support\Facades\DB::select('SHOW COLUMNS FROM nhat_ky_sua_chua LIKE \'ket_qua\'');
echo 'nhat_ky_sua_chua: ' . $columns3[0]->Type . "\n";
