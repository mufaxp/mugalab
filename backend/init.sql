-- MUGALAB - DATABASE INITIALIZATION SCRIPT
-- Database: `lab-db`

-- 1. Buat database jika belum ada
CREATE DATABASE IF NOT EXISTS `lab-db`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- 2. Gunakan database lab-db
USE `lab-db`;

-- TABEL: lab
-- Menyimpan data ruang laboratorium
CREATE TABLE IF NOT EXISTS `lab` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nama` VARCHAR(100) NOT NULL,
    `deskripsi` VARCHAR(255) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- TABEL: users
-- Menyimpan data pengguna yang bisa login ke dashboard
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,          -- Hash bcrypt
    `nama` VARCHAR(100) NOT NULL,
    `role` ENUM('admin', 'laboran', 'guru') NOT NULL DEFAULT 'guru',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- TABEL: jadwal
-- Menyimpan jadwal kegiatan lab per tanggal, jam, dan ruangan
CREATE TABLE IF NOT EXISTS `jadwal` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `penanggung_jawab` VARCHAR(100) NOT NULL,
    `kegiatan` VARCHAR(255) NOT NULL,
    `mata_pelajaran` VARCHAR(100) DEFAULT '',
    `kelas` VARCHAR(50) DEFAULT '-',
    `tanggal` DATE NOT NULL,
    `jam_mulai` INT NOT NULL,
    `jam_selesai` INT NOT NULL,
    `lab_id` INT DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`lab_id`) REFERENCES `lab`(`id`)
        ON DELETE SET NULL
) ENGINE=InnoDB;

-- TABEL: alat
-- Inventaris alat laboratorium
CREATE TABLE IF NOT EXISTS `alat` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `kode_alat` VARCHAR(20) NOT NULL UNIQUE,
    `nama_alat` VARCHAR(150) NOT NULL,
    `produsen` VARCHAR(100) DEFAULT '-',
    `jumlah` INT NOT NULL DEFAULT 0,
    `jumlah_rusak` INT NOT NULL DEFAULT 0,
    `kondisi` ENUM('baik', 'rusak', 'diperbaiki') DEFAULT 'baik',
    `lab_id` INT DEFAULT 1,
    `keterangan` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`lab_id`) REFERENCES `lab`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- TABEL: bahan
-- Inventaris bahan habis pakai
CREATE TABLE IF NOT EXISTS `bahan` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `kode_bahan` VARCHAR(20) NOT NULL UNIQUE,
    `nama_bahan` VARCHAR(150) NOT NULL,
    `produsen` VARCHAR(100) DEFAULT '-',
    `jumlah` DECIMAL(10,2) NOT NULL DEFAULT 0,
    `satuan` VARCHAR(20) NOT NULL DEFAULT 'gram',
    `tanggal_kadaluarsa` DATE NULL,
    `lab_id` INT DEFAULT 1,
    `keterangan` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`lab_id`) REFERENCES `lab`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- TABEL: penggunaan_bahan
-- Riwayat penggunaan bahan
CREATE TABLE IF NOT EXISTS `penggunaan_bahan` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `bahan_id` INT NOT NULL,
    `jumlah_digunakan` DECIMAL(10,2) NOT NULL,
    `penanggung_jawab` VARCHAR(100) NOT NULL,
    `kelas` VARCHAR(50) DEFAULT '-',
    `kegiatan` VARCHAR(255) NOT NULL,
    `tanggal` DATE NOT NULL,
    `keterangan` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`bahan_id`) REFERENCES `bahan`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- TABEL: sarana
-- Inventaris sarana (jas lab, meja, kursi, dll)
CREATE TABLE IF NOT EXISTS `sarana` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `kode_sarana` VARCHAR(20) NOT NULL UNIQUE,
    `nama_sarana` VARCHAR(150) NOT NULL,
    `produsen` VARCHAR(100) DEFAULT '-',
    `jumlah` INT NOT NULL DEFAULT 0,
    `jumlah_rusak` INT NOT NULL DEFAULT 0,
    `kondisi` ENUM('baik', 'rusak', 'diperbaiki') DEFAULT 'baik',
    `lab_id` INT DEFAULT 1,
    `keterangan` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`lab_id`) REFERENCES `lab`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- TABEL: laporan_kerusakan
-- Laporan kerusakan alat/sarana
CREATE TABLE IF NOT EXISTS `laporan_kerusakan` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `alat_id` INT NOT NULL,                       -- Bisa alat atau sarana
    `jumlah_rusak` INT NOT NULL DEFAULT 1,
    `pelapor` VARCHAR(100) NOT NULL,
    `tanggal_lapor` DATE NOT NULL,
    `status` ENUM('rusak', 'diperbaiki', 'selesai', 'dibuang') DEFAULT 'rusak',
    `keterangan` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`alat_id`) REFERENCES `alat`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- TABEL: laporan_praktikum
-- Laporan kegiatan praktikum
CREATE TABLE IF NOT EXISTS `laporan_praktikum` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `jadwal_id` INT NULL,
    `kelas` VARCHAR(50),
    `jumlah_kelompok` INT DEFAULT 1,
    `mata_pelajaran` VARCHAR(100),
    `jam_mulai` INT,
    `jam_selesai` INT,
    `guru_mapel` VARCHAR(100),
    `judul_praktikum` VARCHAR(255),
    `tujuan_praktikum` TEXT,
    `daftar_alat_bahan` TEXT,
    `deskripsi_kegiatan` TEXT,
    `tanggal` DATE,
    `lab_id` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`jadwal_id`) REFERENCES `jadwal`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`lab_id`) REFERENCES `lab`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- TABEL: pengajuan_jadwal
-- Pengajuan jadwal dari pengguna (menunggu ACC admin)
CREATE TABLE IF NOT EXISTS `pengajuan_jadwal` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `pengaju` VARCHAR(100),
    `nomor_wa` VARCHAR(20),
    `penanggung_jawab` VARCHAR(100),
    `mata_pelajaran` VARCHAR(100),
    `kegiatan` VARCHAR(255),
    `kelas` VARCHAR(50),
    `tanggal` DATE,
    `jam_mulai` INT,
    `jam_selesai` INT,
    `lab_id` INT,
    `status` ENUM('pending', 'diterima', 'ditolak') DEFAULT 'pending',
    `alasan_tolak` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `processed_at` TIMESTAMP NULL,
    `processed_by` VARCHAR(100),
    FOREIGN KEY (`lab_id`) REFERENCES `lab`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- TABEL: peminjaman
-- Peminjaman alat/sarana
CREATE TABLE IF NOT EXISTS `peminjaman` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `pemohon` VARCHAR(100) NOT NULL,
    `jenis` ENUM('alat', 'sarana') NOT NULL,
    `alat_id` INT NULL,
    `sarana_id` INT NULL,
    `jumlah` INT DEFAULT 1,
    `kebutuhan` VARCHAR(255),
    `tanggal_pinjam` DATE NOT NULL,
    `tanggal_kembali` DATE NULL,
    `foto_pinjam` VARCHAR(255),
    `foto_kembali` VARCHAR(255),
    `status` ENUM('dipinjam', 'dikembalikan') DEFAULT 'dipinjam',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`alat_id`) REFERENCES `alat`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`sarana_id`) REFERENCES `sarana`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- DATA AWAL: lab
INSERT INTO `lab` (`id`, `nama`, `deskripsi`) VALUES
    (1, 'Lab Biologi-Kimia', 'Praktikum Biologi dan Kimia'),
    (2, 'Lab Fisika', 'Praktikum Fisika')
ON DUPLICATE KEY UPDATE
    `nama` = VALUES(`nama`),
    `deskripsi` = VALUES(`deskripsi`);