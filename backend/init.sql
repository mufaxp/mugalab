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