<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('bao_cao_su_co')) {
            return;
        }

        DB::unprepared(<<<'SQL'
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bao_cao_su_co` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_nguoi_bao_cao` bigint unsigned NOT NULL,
  `ma_may_tinh` bigint unsigned DEFAULT NULL,
  `ma_thiet_bi` bigint unsigned DEFAULT NULL,
  `loai_su_co` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tieu_de` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mo_ta` text COLLATE utf8mb4_unicode_ci,
  `muc_do` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal',
  `trang_thai` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ma_nguoi_bao_cao` (`ma_nguoi_bao_cao`),
  KEY `ma_may_tinh` (`ma_may_tinh`),
  KEY `ma_thiet_bi` (`ma_thiet_bi`),
  CONSTRAINT `bao_cao_su_co_ibfk_1` FOREIGN KEY (`ma_nguoi_bao_cao`) REFERENCES `nguoi_dung` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bao_cao_su_co_ibfk_2` FOREIGN KEY (`ma_may_tinh`) REFERENCES `may_tinh` (`id`) ON DELETE SET NULL,
  CONSTRAINT `bao_cao_su_co_ibfk_3` FOREIGN KEY (`ma_thiet_bi`) REFERENCES `thiet_bi` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chi_tiet_lop_hoc_phan` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_lop_hoc_phan` bigint unsigned NOT NULL,
  `ma_sinh_vien` bigint unsigned NOT NULL,
  `trang_thai` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `chi_tiet_lhp_sinh_vien_unique` (`ma_lop_hoc_phan`,`ma_sinh_vien`),
  KEY `ma_sinh_vien` (`ma_sinh_vien`),
  CONSTRAINT `chi_tiet_lop_hoc_phan_ibfk_1` FOREIGN KEY (`ma_lop_hoc_phan`) REFERENCES `lop_hoc_phan` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chi_tiet_lop_hoc_phan_ibfk_2` FOREIGN KEY (`ma_sinh_vien`) REFERENCES `sinh_vien` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chi_tiet_phieu_muon_may` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_phieu_muon` bigint unsigned NOT NULL,
  `ma_may_tinh` bigint unsigned NOT NULL,
  `tinh_trang_khi_muon` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `chi_tiet_muon_unique` (`ma_phieu_muon`,`ma_may_tinh`),
  KEY `ma_may_tinh` (`ma_may_tinh`),
  CONSTRAINT `chi_tiet_phieu_muon_may_ibfk_1` FOREIGN KEY (`ma_phieu_muon`) REFERENCES `phieu_muon_may` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chi_tiet_phieu_muon_may_ibfk_2` FOREIGN KEY (`ma_may_tinh`) REFERENCES `may_tinh` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chi_tiet_phieu_nhap_may` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_phieu_nhap` bigint unsigned NOT NULL,
  `ma_may_tinh` bigint unsigned NOT NULL,
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `chi_tiet_nhap_unique` (`ma_phieu_nhap`,`ma_may_tinh`),
  KEY `ma_may_tinh` (`ma_may_tinh`),
  CONSTRAINT `chi_tiet_phieu_nhap_may_ibfk_1` FOREIGN KEY (`ma_phieu_nhap`) REFERENCES `phieu_nhap_may` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chi_tiet_phieu_nhap_may_ibfk_2` FOREIGN KEY (`ma_may_tinh`) REFERENCES `may_tinh` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chi_tiet_phieu_tra_may` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_phieu_tra` bigint unsigned NOT NULL,
  `ma_may_tinh` bigint unsigned NOT NULL,
  `tinh_trang_khi_tra` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `chi_tiet_tra_unique` (`ma_phieu_tra`,`ma_may_tinh`),
  KEY `ma_may_tinh` (`ma_may_tinh`),
  CONSTRAINT `chi_tiet_phieu_tra_may_ibfk_1` FOREIGN KEY (`ma_phieu_tra`) REFERENCES `phieu_tra_may` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chi_tiet_phieu_tra_may_ibfk_2` FOREIGN KEY (`ma_may_tinh`) REFERENCES `may_tinh` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dat_phong_may` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_giang_vien` bigint unsigned NOT NULL,
  `ma_phong` bigint unsigned NOT NULL,
  `ma_tuan` bigint unsigned DEFAULT NULL,
  `ngay_dat` date NOT NULL,
  `tiet_bat_dau` tinyint unsigned NOT NULL DEFAULT '1',
  `tiet_ket_thuc` tinyint unsigned NOT NULL DEFAULT '1',
  `muc_dich` text COLLATE utf8mb4_unicode_ci,
  `trang_thai_duyet` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `dat_phong_phong_ngay_tiet_index` (`ma_phong`,`ngay_dat`,`tiet_bat_dau`,`tiet_ket_thuc`),
  KEY `ma_giang_vien` (`ma_giang_vien`),
  KEY `ma_tuan` (`ma_tuan`),
  CONSTRAINT `dat_phong_may_ibfk_1` FOREIGN KEY (`ma_giang_vien`) REFERENCES `giang_vien` (`id`) ON DELETE CASCADE,
  CONSTRAINT `dat_phong_may_ibfk_2` FOREIGN KEY (`ma_phong`) REFERENCES `phong_may` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `dat_phong_may_ibfk_3` FOREIGN KEY (`ma_tuan`) REFERENCES `tuan` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_dat_phong_tiet_hop_le` CHECK (((`tiet_bat_dau` > 0) and (`tiet_ket_thuc` >= `tiet_bat_dau`)))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `diem_danh` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_lich_su_dung` bigint unsigned NOT NULL,
  `ma_sinh_vien` bigint unsigned NOT NULL,
  `ma_lop_hoc_phan` bigint unsigned DEFAULT NULL,
  `ma_may_tinh` bigint unsigned DEFAULT NULL,
  `thoi_gian_check_in` timestamp NULL DEFAULT NULL,
  `trang_thai` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'present',
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `diem_danh_lich_su_sinh_vien_unique` (`ma_lich_su_dung`,`ma_sinh_vien`),
  KEY `ma_sinh_vien` (`ma_sinh_vien`),
  KEY `ma_lop_hoc_phan` (`ma_lop_hoc_phan`),
  KEY `ma_may_tinh` (`ma_may_tinh`),
  CONSTRAINT `diem_danh_ibfk_1` FOREIGN KEY (`ma_lich_su_dung`) REFERENCES `lich_su_dung_phong_may` (`id`) ON DELETE CASCADE,
  CONSTRAINT `diem_danh_ibfk_2` FOREIGN KEY (`ma_sinh_vien`) REFERENCES `sinh_vien` (`id`) ON DELETE CASCADE,
  CONSTRAINT `diem_danh_ibfk_3` FOREIGN KEY (`ma_lop_hoc_phan`) REFERENCES `lop_hoc_phan` (`id`) ON DELETE CASCADE,
  CONSTRAINT `diem_danh_ibfk_4` FOREIGN KEY (`ma_may_tinh`) REFERENCES `may_tinh` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ghi_nhan_may_giao_vien` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_lich_su_dung` bigint unsigned NOT NULL,
  `ma_may_tinh_giao_vien` bigint unsigned NOT NULL,
  `ghi_chu_buoi_hoc` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ma_lich_su_dung` (`ma_lich_su_dung`),
  KEY `ma_may_tinh_giao_vien` (`ma_may_tinh_giao_vien`),
  CONSTRAINT `ghi_nhan_may_giao_vien_ibfk_1` FOREIGN KEY (`ma_lich_su_dung`) REFERENCES `lich_su_dung_phong_may` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ghi_nhan_may_giao_vien_ibfk_2` FOREIGN KEY (`ma_may_tinh_giao_vien`) REFERENCES `may_tinh` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `giang_vien` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_nguoi_dung` bigint unsigned NOT NULL,
  `ma_giang_vien` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ma_phong_ban` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_nguoi_dung` (`ma_nguoi_dung`),
  UNIQUE KEY `ma_giang_vien` (`ma_giang_vien`),
  KEY `ma_phong_ban` (`ma_phong_ban`),
  CONSTRAINT `giang_vien_ibfk_1` FOREIGN KEY (`ma_nguoi_dung`) REFERENCES `nguoi_dung` (`id`) ON DELETE CASCADE,
  CONSTRAINT `giang_vien_ibfk_2` FOREIGN KEY (`ma_phong_ban`) REFERENCES `phong_ban` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lich_su_dieu_chuyen_may` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_phong_cu` bigint unsigned DEFAULT NULL,
  `ma_phong_moi` bigint unsigned DEFAULT NULL,
  `ma_nguoi_dieu_chuyen` bigint unsigned DEFAULT NULL,
  `thoi_gian_dieu_chuyen` timestamp NULL DEFAULT NULL,
  `ly_do` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ma_phong_cu` (`ma_phong_cu`),
  KEY `ma_phong_moi` (`ma_phong_moi`),
  KEY `ma_nguoi_dieu_chuyen` (`ma_nguoi_dieu_chuyen`),
  CONSTRAINT `lich_su_dieu_chuyen_may_ibfk_1` FOREIGN KEY (`ma_phong_cu`) REFERENCES `phong_may` (`id`) ON DELETE SET NULL,
  CONSTRAINT `lich_su_dieu_chuyen_may_ibfk_2` FOREIGN KEY (`ma_phong_moi`) REFERENCES `phong_may` (`id`) ON DELETE SET NULL,
  CONSTRAINT `lich_su_dieu_chuyen_may_ibfk_3` FOREIGN KEY (`ma_nguoi_dieu_chuyen`) REFERENCES `nguoi_dung` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lich_su_dung_phong_may` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_phong` bigint unsigned NOT NULL,
  `ma_lop` bigint unsigned DEFAULT NULL,
  `ma_lop_hoc_phan` bigint unsigned DEFAULT NULL,
  `ma_giang_vien` bigint unsigned DEFAULT NULL,
  `ma_tuan` bigint unsigned NOT NULL,
  `ma_dat_phong_may` bigint unsigned DEFAULT NULL,
  `ngay_hoc_cu_the` date NOT NULL,
  `thu_trong_tuan` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `so_tiet_bat_dau` tinyint unsigned NOT NULL,
  `so_tiet_ket_thuc` tinyint unsigned NOT NULL,
  `loai_lich` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ChinhThuc',
  `trang_thai` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'scheduled',
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ls_dung_phong_ngay_tiet_index` (`ma_phong`,`ngay_hoc_cu_the`,`so_tiet_bat_dau`,`so_tiet_ket_thuc`),
  KEY `ma_lop` (`ma_lop`),
  KEY `ma_lop_hoc_phan` (`ma_lop_hoc_phan`),
  KEY `ma_giang_vien` (`ma_giang_vien`),
  KEY `ma_tuan` (`ma_tuan`),
  KEY `ma_dat_phong_may` (`ma_dat_phong_may`),
  CONSTRAINT `lich_su_dung_phong_may_ibfk_1` FOREIGN KEY (`ma_phong`) REFERENCES `phong_may` (`id`) ON DELETE CASCADE,
  CONSTRAINT `lich_su_dung_phong_may_ibfk_2` FOREIGN KEY (`ma_lop`) REFERENCES `lop_hoc` (`id`) ON DELETE SET NULL,
  CONSTRAINT `lich_su_dung_phong_may_ibfk_3` FOREIGN KEY (`ma_lop_hoc_phan`) REFERENCES `lop_hoc_phan` (`id`) ON DELETE SET NULL,
  CONSTRAINT `lich_su_dung_phong_may_ibfk_4` FOREIGN KEY (`ma_giang_vien`) REFERENCES `giang_vien` (`id`) ON DELETE SET NULL,
  CONSTRAINT `lich_su_dung_phong_may_ibfk_5` FOREIGN KEY (`ma_tuan`) REFERENCES `tuan` (`id`) ON DELETE CASCADE,
  CONSTRAINT `lich_su_dung_phong_may_ibfk_6` FOREIGN KEY (`ma_dat_phong_may`) REFERENCES `dat_phong_may` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lop_hoc` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_lop` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nien_khoa` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `chuyen_nganh` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ma_giang_vien` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_lop` (`ma_lop`),
  KEY `ma_giang_vien` (`ma_giang_vien`),
  CONSTRAINT `lop_hoc_ibfk_1` FOREIGN KEY (`ma_giang_vien`) REFERENCES `giang_vien` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lop_hoc_phan` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_lop_hoc_phan` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ma_mon` bigint unsigned NOT NULL,
  `ma_nam_hoc` bigint unsigned NOT NULL,
  `ma_lop` bigint unsigned DEFAULT NULL,
  `ma_phong` bigint unsigned DEFAULT NULL,
  `si_so_toi_da` int unsigned NOT NULL DEFAULT '0',
  `trang_thai` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_lop_hoc_phan` (`ma_lop_hoc_phan`),
  KEY `ma_mon` (`ma_mon`),
  KEY `ma_nam_hoc` (`ma_nam_hoc`),
  KEY `ma_phong` (`ma_phong`),
  KEY `lop_hoc_phan_ma_lop_foreign` (`ma_lop`),
  CONSTRAINT `lop_hoc_phan_ibfk_1` FOREIGN KEY (`ma_mon`) REFERENCES `mon_hoc` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `lop_hoc_phan_ibfk_2` FOREIGN KEY (`ma_nam_hoc`) REFERENCES `nam_hoc` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `lop_hoc_phan_ibfk_3` FOREIGN KEY (`ma_phong`) REFERENCES `phong_may` (`id`) ON DELETE SET NULL,
  CONSTRAINT `lop_hoc_phan_ma_lop_foreign` FOREIGN KEY (`ma_lop`) REFERENCES `lop_hoc` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `may_tinh` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_phong` bigint unsigned NOT NULL,
  `ma_may` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ten_may` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vi_tri` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ma_qr` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bo_xu_ly` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ram` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `card_do_hoa` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bo_mach_chu` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `man_hinh` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ban_phim` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `chuot` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hdd` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ssd` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trang_thai` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_may` (`ma_may`),
  UNIQUE KEY `may_tinh_ma_phong_ten_may_unique` (`ma_phong`,`ten_may`),
  UNIQUE KEY `ma_qr` (`ma_qr`),
  CONSTRAINT `may_tinh_ibfk_1` FOREIGN KEY (`ma_phong`) REFERENCES `phong_may` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chi_tiet_dieu_chuyen_may` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_lich_su_dieu_chuyen` bigint unsigned NOT NULL,
  `ma_may_tinh` bigint unsigned NOT NULL,
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `chi_tiet_dieu_chuyen_unique` (`ma_lich_su_dieu_chuyen`,`ma_may_tinh`),
  KEY `ma_may_tinh` (`ma_may_tinh`),
  CONSTRAINT `chi_tiet_dieu_chuyen_may_ibfk_1` FOREIGN KEY (`ma_lich_su_dieu_chuyen`) REFERENCES `lich_su_dieu_chuyen_may` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chi_tiet_dieu_chuyen_may_ibfk_2` FOREIGN KEY (`ma_may_tinh`) REFERENCES `may_tinh` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mon_hoc` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_mon_hoc` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ten_mon` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `loai_mon` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `so_tin_chi` tinyint unsigned NOT NULL DEFAULT '0',
  `mo_ta` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_mon_hoc` (`ma_mon_hoc`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nam_hoc` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ten_nam_hoc` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ngay_bat_dau` date NOT NULL,
  `ngay_ket_thuc` date NOT NULL,
  `trang_thai` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ten_nam_hoc` (`ten_nam_hoc`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nguoi_dung` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_vai_tro` bigint unsigned NOT NULL,
  `ho_ten` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mat_khau` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `so_dien_thoai` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gioi_tinh` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_sinh` date DEFAULT NULL,
  `trang_thai` tinyint unsigned NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `ma_vai_tro` (`ma_vai_tro`),
  CONSTRAINT `nguoi_dung_ibfk_1` FOREIGN KEY (`ma_vai_tro`) REFERENCES `vai_tro` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nhat_ky_sua_chua` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_phieu_bao_tri` bigint unsigned DEFAULT NULL,
  `ma_may_tinh` bigint unsigned DEFAULT NULL,
  `ma_thiet_bi` bigint unsigned DEFAULT NULL,
  `ma_nguoi_sua` bigint unsigned DEFAULT NULL,
  `thoi_gian_sua` timestamp NULL DEFAULT NULL,
  `noi_dung_sua` text COLLATE utf8mb4_unicode_ci,
  `ket_qua` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `chi_phi` decimal(12,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ma_phieu_bao_tri` (`ma_phieu_bao_tri`),
  KEY `ma_may_tinh` (`ma_may_tinh`),
  KEY `ma_thiet_bi` (`ma_thiet_bi`),
  KEY `ma_nguoi_sua` (`ma_nguoi_sua`),
  CONSTRAINT `nhat_ky_sua_chua_ibfk_1` FOREIGN KEY (`ma_phieu_bao_tri`) REFERENCES `phieu_bao_tri` (`id`) ON DELETE SET NULL,
  CONSTRAINT `nhat_ky_sua_chua_ibfk_2` FOREIGN KEY (`ma_may_tinh`) REFERENCES `may_tinh` (`id`) ON DELETE SET NULL,
  CONSTRAINT `nhat_ky_sua_chua_ibfk_3` FOREIGN KEY (`ma_thiet_bi`) REFERENCES `thiet_bi` (`id`) ON DELETE SET NULL,
  CONSTRAINT `nhat_ky_sua_chua_ibfk_4` FOREIGN KEY (`ma_nguoi_sua`) REFERENCES `nguoi_dung` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phan_cong_giang_vien` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_giang_vien` bigint unsigned NOT NULL,
  `ma_lop_hoc_phan` bigint unsigned NOT NULL,
  `trang_thai` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `phan_cong_giang_vien_lhp_unique` (`ma_giang_vien`,`ma_lop_hoc_phan`),
  KEY `ma_lop_hoc_phan` (`ma_lop_hoc_phan`),
  CONSTRAINT `phan_cong_giang_vien_ibfk_1` FOREIGN KEY (`ma_giang_vien`) REFERENCES `giang_vien` (`id`) ON DELETE CASCADE,
  CONSTRAINT `phan_cong_giang_vien_ibfk_2` FOREIGN KEY (`ma_lop_hoc_phan`) REFERENCES `lop_hoc_phan` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phieu_bao_tri` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_bao_cao_su_co` bigint unsigned NOT NULL,
  `ma_nguoi_phu_trach` bigint unsigned DEFAULT NULL,
  `loai_bao_tri` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_bat_dau` date DEFAULT NULL,
  `ngay_ket_thuc` date DEFAULT NULL,
  `cach_xu_ly` text COLLATE utf8mb4_unicode_ci,
  `chi_phi` decimal(12,2) NOT NULL DEFAULT '0.00',
  `trang_thai` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ma_bao_cao_su_co` (`ma_bao_cao_su_co`),
  KEY `ma_nguoi_phu_trach` (`ma_nguoi_phu_trach`),
  CONSTRAINT `phieu_bao_tri_ibfk_1` FOREIGN KEY (`ma_bao_cao_su_co`) REFERENCES `bao_cao_su_co` (`id`) ON DELETE CASCADE,
  CONSTRAINT `phieu_bao_tri_ibfk_2` FOREIGN KEY (`ma_nguoi_phu_trach`) REFERENCES `nguoi_dung` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phieu_muon_may` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_phieu_muon` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ma_giang_vien` bigint unsigned NOT NULL,
  `ma_phong_ban` bigint unsigned NOT NULL,
  `ngay_muon` datetime NOT NULL,
  `so_luong` int unsigned NOT NULL DEFAULT '0',
  `ly_do_muon` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trang_thai` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Äang mÆ°á»£n',
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_phieu_muon` (`ma_phieu_muon`),
  KEY `ma_giang_vien` (`ma_giang_vien`),
  KEY `ma_phong_ban` (`ma_phong_ban`),
  CONSTRAINT `phieu_muon_may_ibfk_1` FOREIGN KEY (`ma_giang_vien`) REFERENCES `giang_vien` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `phieu_muon_may_ibfk_2` FOREIGN KEY (`ma_phong_ban`) REFERENCES `phong_ban` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phieu_nhap_may` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_phieu_nhap` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ngay_nhap` date NOT NULL,
  `so_luong` int unsigned NOT NULL DEFAULT '0',
  `nha_cung_cap` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_phieu_nhap` (`ma_phieu_nhap`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phieu_tra_may` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_phieu_tra` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ma_phieu_muon` bigint unsigned DEFAULT NULL,
  `thoi_gian_tra` datetime DEFAULT NULL,
  `so_luong` int unsigned NOT NULL DEFAULT '0',
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_phieu_tra` (`ma_phieu_tra`),
  KEY `ma_phieu_muon` (`ma_phieu_muon`),
  CONSTRAINT `phieu_tra_may_ibfk_1` FOREIGN KEY (`ma_phieu_muon`) REFERENCES `phieu_muon_may` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phong_ban` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_phong_ban` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ten_phong_ban` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trang_thai` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `mo_ta` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_phong_ban` (`ma_phong_ban`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phong_may` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_phong` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ten_phong` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `suc_chua` int unsigned NOT NULL DEFAULT '0',
  `trang_thai` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `mo_ta` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_phong` (`ma_phong`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sinh_vien` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_nguoi_dung` bigint unsigned NOT NULL,
  `ma_lop` bigint unsigned DEFAULT NULL,
  `ma_sinh_vien` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nien_khoa` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_nguoi_dung` (`ma_nguoi_dung`),
  UNIQUE KEY `ma_sinh_vien` (`ma_sinh_vien`),
  KEY `ma_lop` (`ma_lop`),
  CONSTRAINT `sinh_vien_ibfk_1` FOREIGN KEY (`ma_nguoi_dung`) REFERENCES `nguoi_dung` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sinh_vien_ibfk_2` FOREIGN KEY (`ma_lop`) REFERENCES `lop_hoc` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `thiet_bi` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_phong` bigint unsigned DEFAULT NULL,
  `ten_thiet_bi` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `so_luong` int unsigned NOT NULL DEFAULT '0',
  `don_vi` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trang_thai` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ma_phong` (`ma_phong`),
  CONSTRAINT `thiet_bi_ibfk_1` FOREIGN KEY (`ma_phong`) REFERENCES `phong_may` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tuan` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ma_nam_hoc` bigint unsigned NOT NULL,
  `so_tuan` smallint unsigned NOT NULL,
  `ngay_bat_dau` date NOT NULL,
  `ngay_ket_thuc` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tuan_nam_hoc_so_tuan_unique` (`ma_nam_hoc`,`so_tuan`),
  CONSTRAINT `tuan_ibfk_1` FOREIGN KEY (`ma_nam_hoc`) REFERENCES `nam_hoc` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=164 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vai_tro` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ten_vai_tro` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mo_ta` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ten_vai_tro` (`ten_vai_tro`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

SQL);
    }

    public function down(): void
    {
        DB::unprepared(<<<'SQL'
SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS `bao_cao_su_co`;
DROP TABLE IF EXISTS `chi_tiet_dieu_chuyen_may`;
DROP TABLE IF EXISTS `chi_tiet_lop_hoc_phan`;
DROP TABLE IF EXISTS `chi_tiet_phieu_muon_may`;
DROP TABLE IF EXISTS `chi_tiet_phieu_nhap_may`;
DROP TABLE IF EXISTS `chi_tiet_phieu_tra_may`;
DROP TABLE IF EXISTS `dat_phong_may`;
DROP TABLE IF EXISTS `diem_danh`;
DROP TABLE IF EXISTS `ghi_nhan_may_giao_vien`;
DROP TABLE IF EXISTS `giang_vien`;
DROP TABLE IF EXISTS `lich_su_dieu_chuyen_may`;
DROP TABLE IF EXISTS `lich_su_dung_phong_may`;
DROP TABLE IF EXISTS `lop_hoc`;
DROP TABLE IF EXISTS `lop_hoc_phan`;
DROP TABLE IF EXISTS `may_tinh`;
DROP TABLE IF EXISTS `mon_hoc`;
DROP TABLE IF EXISTS `nam_hoc`;
DROP TABLE IF EXISTS `nguoi_dung`;
DROP TABLE IF EXISTS `nhat_ky_sua_chua`;
DROP TABLE IF EXISTS `personal_access_tokens`;
DROP TABLE IF EXISTS `phan_cong_giang_vien`;
DROP TABLE IF EXISTS `phieu_bao_tri`;
DROP TABLE IF EXISTS `phieu_muon_may`;
DROP TABLE IF EXISTS `phieu_nhap_may`;
DROP TABLE IF EXISTS `phieu_tra_may`;
DROP TABLE IF EXISTS `phong_ban`;
DROP TABLE IF EXISTS `phong_may`;
DROP TABLE IF EXISTS `sinh_vien`;
DROP TABLE IF EXISTS `thiet_bi`;
DROP TABLE IF EXISTS `tuan`;
DROP TABLE IF EXISTS `vai_tro`;
SET FOREIGN_KEY_CHECKS=1;
SQL);
    }
};
