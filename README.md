# Sistem Informasi Perpustakaan Baitul Hikmah
## MI Islamiyah Kalilandak

Aplikasi web perpustakaan dengan arsitektur **Offline-First** yang mendukung sinkronisasi ke server PHP & MySQL.

---

## 🎯 Fitur Utama

### ✅ **Offline-First PWA**
- Aplikasi dapat digunakan tanpa internet (penyimpanan IndexedDB)
- Service Worker untuk caching aset
- Manifest.json untuk instalasi sebagai aplikasi standalone
- Auto-sync saat koneksi kembali online (opsional)

### 📚 **Katalog Buku**
- CRUD buku lengkap (kode otomatis BH-0001, BH-0002, dst)
- Pencarian real-time & filter kategori
- Cetak barcode Code128 (batch/single)
- Stok otomatis (berkurang saat dipinjam, bertambah saat dikembalikan)
- Responsive table/card view

### 👥 **Manajemen Anggota**
- Pendaftaran siswa/guru/staf
- Nomor anggota otomatis (A-00001, A-00002, dst)
- Status aktif/nonaktif
- Filter kelas dan jenis anggota

### 🔄 **Sirkulasi Peminjaman**
- Form peminjaman dengan autocomplete (search anggota & buku)
- Support barcode scanner USB
- Validasi maksimal buku per anggota
- Tracking peminjaman terlambat & perhitungan denda otomatis
- Pengembalian buku dengan satu klik
- Riwayat transaksi

### 👨‍💼 **Manajemen Petugas**
- Login dengan username/password (hash SHA-256)
- Role: Admin & Petugas
- Admin dapat mengelola petugas lain
- Ganti password wajib untuk akun default

### ☁️ **Sinkronisasi Server**
- Push data lokal ke MySQL server
- Indikator data belum tersinkron
- Log sinkronisasi
- API dengan token authentication

### 💾 **Backup & Restore**
- Ekspor semua data ke JSON
- Impor JSON dengan preview
- Backup transaksi bulanan
- Pengingat backup otomatis

### ⚙️ **Pengaturan Fleksibel**
- Lama peminjaman (default: 7 hari)
- Maksimal buku per anggota (default: 2)
- Denda per hari keterlambatan
- URL API & Token

---

## 📁 Struktur Folder

```
perpustakaan-baitul-hikmah-v2/
├── index.html                  # Halaman utama
├── manifest.json               # PWA manifest
├── sw.js                       # Service Worker
├── assets/
│   ├── css/
│   │   └── tailwind.min.css    # Tailwind CSS (offline)
│   ├── js/
│   │   ├── app.js              # Entry point aplikasi
│   │   ├── db.js               # IndexedDB wrapper
│   │   ├── ui.js               # UI utilities
│   │   ├── sync.js             # Sinkronisasi
│   │   ├── buku.js             # Modul buku
│   │   ├── anggota.js          # Modul anggota
│   │   ├── sirkulasi.js        # Modul peminjaman
│   │   └── backup.js           # Modul backup
│   └── vendor/
│       └── jsbarcode.min.js    # Library barcode
├── api/
│   ├── config.sample.php       # Template konfigurasi
│   ├── db.php                  # Database connection
│   ├── auth.php                # Authentication
│   ├── sync.php                # Endpoint sinkronisasi
│   └── ping.php                # Health check
└── database/
    └── schema.sql              # SQL schema
```

---

## 🚀 Instalasi

### A. Mode Offline-Only (Tanpa Server)

1. **Buka file `index.html` di browser modern**
   - Chrome/Edge 90+
   - Firefox 88+
   - Safari 14+

2. **Login dengan akun default:**
   - Username: `admin`
   - Password: `admin123`
   - ⚠️ **WAJIB ganti password** setelah login pertama

3. **Mulai gunakan aplikasi offline**
   - Data tersimpan di browser (IndexedDB)
   - Backup manual dengan fitur Ekspor JSON

---

### B. Mode Online (Dengan Server PHP & MySQL)

#### 1. **Setup Database MySQL**

```bash
# Login ke MySQL
mysql -u root -p

# Import schema
mysql -u root -p < database/schema.sql
```

**Atau via phpMyAdmin:**
- Buat database: `perpustakaan_baitul_hikmah`
- Import file: `database/schema.sql`

---

#### 2. **Upload ke Hosting/Server**

**Via cPanel File Manager / FTP:**

```
public_html/
└── perpustakaan/
    ├── index.html
    ├── manifest.json
    ├── sw.js
    ├── assets/
    ├── api/
    └── database/
```

---

#### 3. **Konfigurasi API**

```bash
# Copy sample config
cd api/
cp config.sample.php config.php
```

**Edit `api/config.php`:**

```php
<?php
// Database
define('DB_HOST', 'localhost');
define('DB_NAME', 'perpustakaan_baitul_hikmah');
define('DB_USER', 'your_db_username');
define('DB_PASS', 'your_db_password');

// API Token (ganti dengan string acak panjang)
define('API_TOKEN', 'GANTI_DENGAN_TOKEN_RAHASIA_ANDA_12345ABCDEF');
```

**Generate token acak (opsional):**
```bash
# Linux/Mac
openssl rand -hex 32

# Atau online: https://www.random.org/strings/
```

---

#### 4. **Aktifkan HTTPS (WAJIB untuk PWA)**

Service Worker hanya bekerja di HTTPS (kecuali localhost).

**Cara aktifkan SSL di cPanel:**
1. cPanel → SSL/TLS Status
2. Klik "Run AutoSSL" (gratis dari Let's Encrypt)
3. Tunggu sertifikat aktif

**Atau gunakan Cloudflare (gratis):**
1. Tambahkan domain ke Cloudflare
2. Update nameserver
3. SSL/TLS → Full

---

#### 5. **Konfigurasi di Aplikasi**

1. Buka aplikasi → Login
2. Menu **Pengaturan**
3. **Pengaturan API Server:**
   - URL API: `https://yourdomain.com/perpustakaan/api`
   - Token API: (sama dengan di config.php)
   - ✅ Auto-sync (opsional)
4. Klik **Simpan**

5. Menu **Sinkronisasi & Backup**
6. Klik **Sinkronkan Sekarang**

---

## 🔐 Keamanan

### ⚠️ PENTING - Sebelum Deploy Production:

1. **Ganti password admin default**
   - Login → Menu Pengaturan → Ganti Password

2. **Amankan config.php**
   ```bash
   chmod 600 api/config.php
   ```

3. **Gunakan token API yang kuat**
   - Minimal 32 karakter acak
   - Jangan commit ke Git

4. **Aktifkan HTTPS**
   - Service Worker tidak jalan tanpa HTTPS

5. **Set CORS di api/sync.php** (jika domain berbeda)
   ```php
   header('Access-Control-Allow-Origin: https://yourdomain.com');
   ```

6. **Disable display_errors di production** (sudah ada di config.php)
   ```php
   ini_set('display_errors', 0);
   ```

7. **Backup database rutin**
   ```bash
   # Cron job (setiap hari jam 2 pagi)
   0 2 * * * mysqldump -u user -ppass perpustakaan_baitul_hikmah > backup-$(date +\%Y\%m\%d).sql
   ```

---

## 📖 Cara Penggunaan

### Login
- Akun default: `admin` / `admin123`
- Ganti password wajib saat pertama kali

### Dashboard
- Lihat statistik: total buku, anggota, peminjaman aktif
- Peminjaman terbaru & buku terpopuler

### Tambah Buku
1. Menu **Katalog Buku**
2. Isi form (kode otomatis)
3. Simpan
4. Cetak Barcode (pilih buku → Cetak Barcode)

### Daftar Anggota
1. Menu **Anggota**
2. Pilih jenis (Siswa/Guru/Staf)
3. Isi data lengkap
4. Simpan

### Proses Peminjaman
1. Menu **Sirkulasi**
2. Ketik nama anggota → pilih dari dropdown
3. Ketik judul buku atau scan barcode → pilih
4. Tanggal otomatis terisi (bisa diubah)
5. Klik **Proses Peminjaman**
6. Stok buku berkurang otomatis

### Pengembalian
1. Menu **Sirkulasi** → bagian kanan
2. Klik **Kembalikan Buku** pada transaksi aktif
3. Jika terlambat, denda dihitung otomatis
4. Konfirmasi → Stok bertambah otomatis

### Sinkronisasi
1. Menu **Sinkronisasi & Backup**
2. Pastikan status "Terhubung" (hijau)
3. Klik **Sinkronkan Sekarang**
4. Data lokal di-push ke server MySQL

### Backup Manual
1. Menu **Sinkronisasi & Backup**
2. **Ekspor Semua Data (JSON)** → simpan file
3. **Impor dari File JSON** → restore data

### Backup Bulanan
1. Pilih bulan & tahun
2. Klik **Ekspor Transaksi Bulan Ini**
3. File JSON berisi laporan transaksi periode tersebut

---

## 🛠️ Troubleshooting

### ❌ Service Worker tidak register
**Solusi:**
- Pastikan akses via HTTPS (bukan HTTP)
- Atau gunakan `localhost` untuk testing
- Cek console browser (F12)

### ❌ Sinkronisasi gagal: 401 Unauthorized
**Solusi:**
- Token API tidak cocok
- Cek `api/config.php` dan pengaturan aplikasi
- Pastikan token sama persis (case-sensitive)

### ❌ Sinkronisasi gagal: Connection refused
**Solusi:**
- URL API salah (cek ada `/api` di akhir)
- Server down atau firewall block
- Cek `api/ping.php` bisa diakses browser

### ❌ Database connection failed
**Solusi:**
- Cek credentials di `api/config.php`
- Pastikan user MySQL punya privilege
- Test koneksi:
  ```bash
  mysql -h localhost -u username -p perpustakaan_baitul_hikmah
  ```

### ❌ Data hilang setelah clear browser
**Solusi:**
- IndexedDB terhapus saat clear site data
- **Backup rutin** dengan Ekspor JSON
- Aktifkan sinkronisasi server

### ❌ Barcode tidak muncul
**Solusi:**
- Cek `assets/vendor/jsbarcode.min.js` ada
- Lihat console error (F12)
- Kode buku harus format alphanumeric

### ❌ Aplikasi lambat setelah banyak data
**Solusi:**
- Backup data lama ke JSON
- Hapus transaksi tahun lalu dari database
- Gunakan pagination (sudah built-in)

---

## 📱 Install sebagai Aplikasi (PWA)

### Android (Chrome):
1. Buka aplikasi di Chrome
2. Klik ⋮ (menu) → **Install app** / **Add to Home screen**
3. Icon muncul di home screen

### iOS (Safari):
1. Buka aplikasi di Safari
2. Tap tombol **Share** (kotak dengan panah)
3. Scroll → **Add to Home Screen**

### Desktop (Chrome/Edge):
1. Klik icon ⊕ di address bar
2. Atau: Menu → **Install Baitul Hikmah**

---

## 🔄 Update Aplikasi

### Update Frontend:
1. Upload file baru via FTP
2. Edit `sw.js` → ubah `CACHE_NAME` (contoh: `baitul-hikmah-v2`)
3. User akan otomatis update saat refresh

### Update Database:
```sql
-- Backup dulu
mysqldump perpustakaan_baitul_hikmah > backup-before-update.sql

-- Jalankan migration SQL
ALTER TABLE buku ADD COLUMN kolom_baru VARCHAR(255);
```

---

## 📊 Laporan & Statistik

Data tersedia di:
- **Dashboard**: Ringkasan real-time
- **Backup Bulanan**: Export JSON per periode
- **Database MySQL**: Query custom untuk laporan lanjutan

**Contoh Query Laporan:**

```sql
-- Top 10 Buku Terpopuler
SELECT b.judul, b.pengarang, COUNT(p.id) as total_dipinjam
FROM peminjaman p
JOIN buku b ON p.buku_id = b.id
GROUP BY b.id
ORDER BY total_dipinjam DESC
LIMIT 10;

-- Anggota dengan Peminjaman Terbanyak
SELECT a.nama, a.nomor_anggota, COUNT(p.id) as total_pinjam
FROM peminjaman p
JOIN anggota a ON p.anggota_id = a.id
WHERE p.status = 'Selesai'
GROUP BY a.id
ORDER BY total_pinjam DESC
LIMIT 10;

-- Total Denda Bulan Ini
SELECT SUM(denda) as total_denda
FROM peminjaman
WHERE MONTH(tanggal_kembali) = MONTH(CURRENT_DATE())
AND YEAR(tanggal_kembali) = YEAR(CURRENT_DATE());
```

---

## ⚡ Performa & Optimasi

- **IndexedDB**: Penyimpanan 50MB+ per origin
- **Service Worker**: Cache aset untuk load instan
- **Pagination**: 20 item per halaman (configurable)
- **Lazy loading**: Page load on-demand
- **Debounce search**: 300ms delay untuk efisiensi

---

## 🆘 Support & Kontak

**Dikembangkan untuk:**
- MI Islamiyah Kalilandak
- Perpustakaan Baitul Hikmah

**Tech Stack:**
- Frontend: HTML5, Tailwind CSS, Vanilla JavaScript
- Backend: PHP 8.0+, MySQL 5.7+
- Storage: IndexedDB, LocalStorage
- PWA: Service Worker, Web App Manifest

**Browser Support:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 📝 Lisensi & Credits

- Tailwind CSS: MIT License
- JsBarcode: MIT License

---

## 🎓 Asumsi & Keputusan Desain

1. **SHA-256 untuk password** (bukan bcrypt) → Untuk kesederhanaan, crypto.subtle API tersedia di browser. Production sebaiknya bcrypt di server.

2. **Soft delete** → Data tidak benar-benar dihapus, hanya ditandai `deleted=1` untuk kemudahan sinkronisasi.

3. **UUID primary key** → Mencegah collision saat merge data offline dari beberapa device.

4. **Last-write-wins conflict resolution** → Konflik sinkronisasi diselesaikan berdasarkan `updated_at` terbaru.

5. **No pull sync** → Sinkronisasi hanya push (client→server). Pull bisa ditambahkan jika ada multi-device editing.

6. **No real-time sync** → Auto-sync via event listener, bukan WebSocket. Untuk sekolah kecil ini cukup.

7. **IndexedDB over LocalStorage** → Kapasitas lebih besar (50MB+ vs 5-10MB), cocok untuk data perpustakaan.

8. **No image upload** → Cover buku tidak disimpan untuk efisiensi storage. Bisa ditambahkan dengan compress + base64.

9. **Denda opsional** → Default Rp 0, bisa diatur sesuai kebijakan perpustakaan.

10. **Token authentication** → Sederhana tapi cukup untuk intranet sekolah. Production tambahkan JWT + refresh token.

---

## ✅ Checklist Deploy

- [ ] Import `database/schema.sql` ke MySQL
- [ ] Copy `api/config.sample.php` ke `api/config.php`
- [ ] Edit credentials database di `config.php`
- [ ] Generate & set API token acak (32+ char)
- [ ] Chmod 600 `api/config.php`
- [ ] Aktifkan HTTPS (SSL certificate)
- [ ] Test akses `https://domain.com/api/ping.php`
- [ ] Login aplikasi dengan admin/admin123
- [ ] **GANTI PASSWORD ADMIN**
- [ ] Set URL API & Token di menu Pengaturan
- [ ] Test sinkronisasi (tambah buku → sync → cek database)
- [ ] Backup database pertama kali
- [ ] Setup cron job backup otomatis (opsional)
- [ ] Install aplikasi sebagai PWA di device
- [ ] Training petugas perpustakaan

---

**Selamat menggunakan! 📚✨**

Jika ada pertanyaan, cek console browser (F12) untuk error detail.
