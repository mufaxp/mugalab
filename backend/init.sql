-- Database dan user
CREATE DATABASE IF NOT EXISTS `lab-db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'mufaxp'@'localhost' IDENTIFIED BY '@Mufa_1998';
GRANT ALL PRIVILEGES ON `lab-db`.* TO 'mufaxp'@'localhost';
FLUSH PRIVILEGES;

-- Tabel users
USE `lab-db`;
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nama VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel pengajuan_jadwal
USE `lab-db`;

CREATE TABLE IF NOT EXISTS pengajuan_jadwal (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pengaju VARCHAR(100),
    nomor_wa VARCHAR(20),
    penanggung_jawab VARCHAR(100),
    mata_pelajaran VARCHAR(100),
    kegiatan VARCHAR(255),
    kelas VARCHAR(50),
    tanggal DATE,
    jam_mulai INT,
    jam_selesai INT,
    lab_id INT,
    status ENUM('pending', 'diterima', 'ditolak') DEFAULT 'pending',
    alasan_tolak TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    processed_by VARCHAR(100)
);