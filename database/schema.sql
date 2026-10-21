-- Database Schema untuk Perpustakaan Baitul Hikmah
-- MySQL/MariaDB
-- 
-- CATATAN: Database harus dibuat via cPanel terlebih dahulu
-- Hapus baris CREATE DATABASE & USE jika import via phpMyAdmin

-- Tabel Buku
CREATE TABLE IF NOT EXISTS buku (
  id CHAR(36) PRIMARY KEY,
  kode_buku VARCHAR(50) UNIQUE NOT NULL,
  judul VARCHAR(255) NOT NULL,
  pengarang VARCHAR(255) NOT NULL,
  penerbit VARCHAR(255),
  tahun_terbit VARCHAR(10),
  isbn VARCHAR(50),
  kategori VARCHAR(100),
  rak_lokasi VARCHAR(50),
  jumlah_total INT DEFAULT 1,
  stok_tersedia INT DEFAULT 1,
  sumber VARCHAR(50),
  keterangan TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0,
  INDEX idx_kode (kode_buku),
  INDEX idx_kategori (kategori),
  INDEX idx_deleted (deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel Kategori
CREATE TABLE IF NOT EXISTS kategori (
  id CHAR(36) PRIMARY KEY,
  nama VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default categories
INSERT INTO kategori (id, nama) VALUES
  (UUID(), 'Fiqih'),
  (UUID(), 'Akidah Akhlak'),
  (UUID(), 'Al-Qur\'an Hadis'),
  (UUID(), 'SKI'),
  (UUID(), 'Bahasa'),
  (UUID(), 'IPA'),
  (UUID(), 'IPS'),
  (UUID(), 'Cerita Anak'),
  (UUID(), 'Referensi'),
  (UUID(), 'Umum')
ON DUPLICATE KEY UPDATE nama=nama;

-- Tabel Anggota
CREATE TABLE IF NOT EXISTS anggota (
  id CHAR(36) PRIMARY KEY,
  nomor_anggota VARCHAR(50) UNIQUE NOT NULL,
  nama VARCHAR(255) NOT NULL,
  jenis ENUM('siswa', 'guru', 'staf') DEFAULT 'siswa',
  kelas VARCHAR(10),
  jenis_kelamin ENUM('L', 'P'),
  alamat TEXT,
  no_hp VARCHAR(20),
  status ENUM('aktif', 'nonaktif') DEFAULT 'aktif',
  tanggal_daftar DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0,
  INDEX idx_nomor (nomor_anggota),
  INDEX idx_status (status),
  INDEX idx_deleted (deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel Petugas
CREATE TABLE IF NOT EXISTS petugas (
  id CHAR(36) PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  jabatan VARCHAR(100),
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  no_hp VARCHAR(20),
  peran ENUM('admin', 'petugas') DEFAULT 'petugas',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel Peminjaman
CREATE TABLE IF NOT EXISTS peminjaman (
  id CHAR(36) PRIMARY KEY,
  kode_transaksi VARCHAR(50) UNIQUE NOT NULL,
  anggota_id CHAR(36) NOT NULL,
  buku_id CHAR(36) NOT NULL,
  tanggal_pinjam DATE NOT NULL,
  tanggal_jatuh_tempo DATE NOT NULL,
  tanggal_kembali DATE,
  status ENUM('Dipinjam', 'Selesai', 'Terlambat') DEFAULT 'Dipinjam',
  petugas_id CHAR(36),
  catatan TEXT,
  denda DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) DEFAULT 0,
  FOREIGN KEY (anggota_id) REFERENCES anggota(id),
  FOREIGN KEY (buku_id) REFERENCES buku(id),
  FOREIGN KEY (petugas_id) REFERENCES petugas(id),
  INDEX idx_kode (kode_transaksi),
  INDEX idx_status (status),
  INDEX idx_anggota (anggota_id),
  INDEX idx_buku (buku_id),
  INDEX idx_deleted (deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel Sync Log
CREATE TABLE IF NOT EXISTS sync_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  waktu TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  arah VARCHAR(20),
  jumlah_data INT DEFAULT 0,
  status VARCHAR(50),
  pesan TEXT,
  INDEX idx_waktu (waktu)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
