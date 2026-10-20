# INSTALASI & TESTING CEPAT

## Quick Start (Offline Mode)

```bash
# 1. Buka index.html di browser
open perpustakaan-baitul-hikmah-v2/index.html

# Atau gunakan web server sederhana
cd perpustakaan-baitul-hikmah-v2
python3 -m http.server 8000
# Buka: http://localhost:8000
```

**Login:**
- Username: `admin`
- Password: `admin123`
- ⚠️ Ganti password setelah login pertama!

---

## Download Dependencies (Offline Support)

### 1. Tailwind CSS
```bash
curl -o assets/css/tailwind.min.css https://cdn.tailwindcss.com/3.3.5
```

### 2. JsBarcode
```bash
curl -o assets/vendor/jsbarcode.min.js https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js
```

**Atau gunakan CDN langsung** (sudah ada di index.html untuk development)

---

## Setup Server (Production)

### 1. Database
```bash
mysql -u root -p < database/schema.sql
```

### 2. Config API
```bash
cd api/
cp config.sample.php config.php
nano config.php  # Edit DB credentials & API token
```

### 3. Upload ke Hosting
Via FTP atau cPanel File Manager:
- Upload semua file ke `public_html/perpustakaan/`
- Set permission: `chmod 600 api/config.php`

### 4. Aktifkan HTTPS
- cPanel: SSL/TLS Status → AutoSSL
- Atau gunakan Cloudflare (gratis)

### 5. Test
```bash
# Test ping
curl https://yourdomain.com/perpustakaan/api/ping.php

# Test sync (harus return 401 jika token salah)
curl -X POST https://yourdomain.com/perpustakaan/api/sync.php
```

---

## Testing Checklist

### ✅ Frontend (Offline)
- [ ] Buka `index.html` di browser
- [ ] Login berhasil (admin/admin123)
- [ ] Dashboard menampilkan statistik
- [ ] Tambah buku baru
- [ ] Cetak barcode
- [ ] Tambah anggota
- [ ] Proses peminjaman
- [ ] Kembalikan buku
- [ ] Ekspor JSON backup
- [ ] Import JSON
- [ ] Ganti password

### ✅ Backend (Server)
- [ ] Database schema terinstall
- [ ] `api/ping.php` return `{"success":true}`
- [ ] `api/config.php` credentials benar
- [ ] HTTPS aktif (tes buka di browser)
- [ ] Sinkronisasi berhasil (status 200)
- [ ] Data muncul di MySQL setelah sync

### ✅ PWA
- [ ] Service Worker registered (cek Console)
- [ ] Manifest.json loaded
- [ ] "Install App" muncul di Chrome
- [ ] Icon custom tampil
- [ ] Offline masih bisa digunakan

---

## Troubleshooting Cepat

| Error | Solusi |
|-------|--------|
| `Cannot read property 'push'` | Bersihkan IndexedDB: F12 → Application → IndexedDB → Delete |
| `401 Unauthorized` | Token tidak cocok, cek config.php vs Pengaturan |
| `Service Worker failed` | Harus HTTPS atau localhost |
| `JsBarcode is not defined` | Download jsbarcode.min.js atau gunakan CDN |
| `Tailwind styles missing` | Gunakan CDN di index.html atau download file |

---

## File Penting

```
perpustakaan-baitul-hikmah-v2/
├── index.html           ← Buka ini untuk mulai
├── README.md            ← Dokumentasi lengkap
├── database/schema.sql  ← Import ke MySQL
└── api/config.php       ← Edit ini untuk server
```

**Total Files:** 22 files  
**Size:** ~248KB (tanpa Tailwind CSS & JsBarcode full)

---

## Support

Cek `README.md` untuk dokumentasi lengkap.

Console browser (F12) untuk debug error.
