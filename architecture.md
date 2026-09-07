# 📘 Arsitektur Proyek MUGALAB

## 1. Gambaran Umum

MUGALAB adalah aplikasi manajemen laboratorium sekolah yang terdiri dari:

- **Frontend Publik** (`/frontend`) – halaman jadwal mingguan & pengajuan jadwal
- **Dashboard** (`/dashboard`) – panel admin/laboran/guru untuk manajemen data
- **Backend** (`/backend`) – REST API utama (Express.js + MySQL)
- **Chatbot WhatsApp** (`/opt/chatbot` di VPS) – layanan webhook Fonnte untuk pengaduan dan pengajuan jadwal

Lokasi di VPS:
- Web apps (frontend, dashboard, backend): `/var/www/mugalab`
- Chatbot: `/opt/chatbot`

---

## 2. Arsitektur Sistem

```
[ Frontend Publik ]      [ Dashboard ]        [ Chatbot WhatsApp ]
        |                       |                        |
        |                       |                        | (webhook Fonnte)
        +-----------------------+------------------------+
                                |
                           [ Backend API ]
                       (Express, port 7000)
                                |
                       [ Database MySQL ]
                    (lab-db untuk backend,
                     chatbot-db untuk chatbot)
```

Backend menggunakan **modular monolith**: satu proses, satu database, tetapi kode dipisah ke dalam modul-modul berdasarkan domain bisnis.

---

## 3. Struktur Folder Backend (Aktual)

```
backend/
├── server.js                  # Entry point, hanya listen
├── app.js                     # Setup Express, middleware, mount routes
├── package.json               # Dependensi & script start
├── .env
├── .env.example
├── config/
│   └── db.js                  # Koneksi pool MySQL
├── shared/
│   ├── middleware/
│   │   ├── verifyToken.js     # Verifikasi JWT
│   │   ├── requireRole.js     # Pembatasan akses berdasarkan role
│   │   ├── uploadPeminjaman.js# Konfigurasi multer untuk upload foto peminjaman
│   │   └── cors.js            # (opsional, saat ini belum dibuat)
│   ├── utils/
│   │   ├── response.js        # Format respons standar API
│   │   ├── whatsapp.js        # Notifikasi WA via Fonnte
│   │   └── helpers.js         # Fungsi bantu (getNamaFromToken, dll.)
│   └── validators/            # Validasi input (opsional)
├── modules/
│   ├── auth/
│   │   ├── auth.routes.js
│   │   ├── auth.controller.js
│   │   └── auth.service.js
│   ├── lab/
│   │   ├── lab.routes.js
│   │   ├── lab.controller.js
│   │   └── lab.service.js
│   ├── jadwal/
│   │   ├── jadwal.routes.js
│   │   ├── jadwal.controller.js
│   │   └── jadwal.service.js
│   ├── alat/
│   │   ├── alat.routes.js
│   │   ├── alat.controller.js
│   │   └── alat.service.js
│   ├── bahan/
│   │   ├── bahan.routes.js
│   │   ├── bahan.controller.js
│   │   └── bahan.service.js
│   ├── sarana/
│   │   ├── sarana.routes.js
│   │   ├── sarana.controller.js
│   │   └── sarana.service.js
│   ├── laporan-kerusakan/
│   │   ├── laporan-kerusakan.routes.js
│   │   ├── laporan-kerusakan.controller.js
│   │   └── laporan-kerusakan.service.js
│   ├── laporan-praktikum/
│   │   ├── laporan-praktikum.routes.js
│   │   ├── laporan-praktikum.controller.js
│   │   └── laporan-praktikum.service.js
│   ├── pengajuan/
│   │   ├── pengajuan.routes.js
│   │   ├── pengajuan.controller.js
│   │   └── pengajuan.service.js
│   ├── peminjaman/
│   │   ├── peminjaman.routes.js
│   │   ├── peminjaman.controller.js
│   │   └── peminjaman.service.js
│   ├── user/
│   │   ├── user.routes.js
│   │   ├── user.controller.js
│   │   └── user.service.js
│   └── settings/
│       ├── settings.routes.js
│       ├── settings.controller.js
│       └── settings.service.js
└── database/
    └── init.sql
```

Setiap modul memiliki:
- **`*.routes.js`** – definisi endpoint, middleware auth/role
- **`*.controller.js`** – menangani request/response, memanggil service
- **`*.service.js`** – logika bisnis dan query database

---

## 4. Daftar Endpoint API

### Auth (`/api/auth`)
| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| POST | `/api/auth/login` | Login, mendapatkan JWT | Publik |

### Lab (`/api/lab`)
| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/lab` | Ambil semua lab | Publik |
| POST | `/api/lab` | Tambah lab | Auth (non-guru) |
| PUT | `/api/lab/:id` | Edit lab | Auth (non-guru) |
| DELETE | `/api/lab/:id` | Hapus lab (cek referensi) | Auth (admin) |

### Jadwal (`/api/jadwal`)
| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/jadwal/public` | Jadwal publik mingguan | Publik |
| GET | `/api/jadwal` | Jadwal dashboard (dengan `minggu_mulai`, `lab_id`) | Auth |
| POST | `/api/jadwal` | Tambah jadwal + kirim notif WA | Auth (non-guru) |
| PUT | `/api/jadwal/:id` | Edit jadwal + notif WA | Auth (non-guru) |
| DELETE | `/api/jadwal/:id` | Hapus jadwal | Auth (non-guru) |

### Alat (`/api/alat`)
| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/alat` | Ambil daftar alat (filter lab) | Auth |
| POST | `/api/alat` | Tambah alat | Auth (non-guru) |
| PUT | `/api/alat/:id` | Edit alat | Auth (non-guru) |
| DELETE | `/api/alat/:id` | Hapus alat | Auth (non-guru) |

### Bahan (`/api/bahan`)
| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/bahan` | Ambil daftar bahan | Auth |
| POST | `/api/bahan` | Tambah bahan | Auth (non-guru) |
| PUT | `/api/bahan/:id` | Edit bahan | Auth (non-guru) |
| DELETE | `/api/bahan/:id` | Hapus bahan | Auth (non-guru) |
| POST | `/api/bahan/pakai` | Catat penggunaan bahan | Auth (non-guru) |
| GET | `/api/bahan/pakai` | Riwayat penggunaan bahan | Auth |
| DELETE | `/api/bahan/pakai/:id` | Hapus riwayat penggunaan | Auth (non-guru) |

### Sarana (`/api/sarana`)
| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/sarana` | Ambil daftar sarana | Auth |
| POST | `/api/sarana` | Tambah sarana | Auth (non-guru) |
| PUT | `/api/sarana/:id` | Edit sarana | Auth (non-guru) |
| DELETE | `/api/sarana/:id` | Hapus sarana | Auth (non-guru) |

### Laporan Kerusakan (`/api/laporan-kerusakan`)
| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/laporan-kerusakan` | Ambil semua laporan (join alat) | Auth |
| POST | `/api/laporan-kerusakan` | Buat laporan, kurangi stok alat | Auth (non-guru) |
| PUT | `/api/laporan-kerusakan/:id` | Update status laporan, sesuaikan stok | Auth (non-guru) |
| DELETE | `/api/laporan-kerusakan/:id` | Hapus laporan, koreksi stok | Auth (non-guru) |

### Laporan Praktikum (`/api/laporan-praktikum`)
| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/laporan-praktikum` | Ambil semua laporan | Auth |
| POST | `/api/laporan-praktikum` | Buat laporan praktikum | Auth |
| PUT | `/api/laporan-praktikum/:id` | Edit laporan | Auth (non-guru) |
| DELETE | `/api/laporan-praktikum/:id` | Hapus laporan | Auth (non-guru) |

### Pengajuan Jadwal (`/api/pengajuan`)
| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/pengajuan` | Ambil semua pengajuan | Auth |
| POST | `/api/pengajuan` | Kirim pengajuan (dari publik/chatbot) | Publik |
| PUT | `/api/pengajuan/:id` | Terima/tolak pengajuan, masukkan ke jadwal | Auth (admin/laboran) |

### Peminjaman (`/api/peminjaman`)
| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/peminjaman` | Ambil daftar peminjaman | Auth |
| POST | `/api/peminjaman` | Pinjam alat/sarana (multipart foto) | Auth |
| PUT | `/api/peminjaman/:id/kembali` | Kembalikan, lapor kerusakan, update stok | Auth (non-guru) |

### User (`/api/users`)
| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/users` | Ambil semua user (tanpa password) | Auth (admin) |
| POST | `/api/users` | Tambah user baru | Auth (admin) |
| PUT | `/api/users/:id` | Edit user (opsional ganti password) | Auth (admin) |
| DELETE | `/api/users/:id` | Hapus user | Auth (admin) |

### Settings (`/api/settings`)
| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/settings/public` | Ambil pengaturan publik (nama sekolah, lab) | Publik |
| GET | `/api/settings` | Ambil semua pengaturan | Auth (admin) |
| PUT | `/api/settings` | Update pengaturan | Auth (admin) |

---

## 5. Database

### 5.1 Nama Database
- **Backend**: `lab-db`
- **Chatbot**: `chatbot` (terpisah)

### 5.2 Tabel Utama
| Tabel | Deskripsi | Relasi |
|-------|-----------|--------|
| `lab` | Ruang laboratorium | - |
| `users` | Pengguna dashboard | - |
| `jadwal` | Jadwal kegiatan | `lab_id` → `lab.id` |
| `alat` | Inventaris alat | `lab_id` → `lab.id` |
| `bahan` | Inventaris bahan | `lab_id` → `lab.id` |
| `sarana` | Inventaris sarana | `lab_id` → `lab.id` |
| `penggunaan_bahan` | Riwayat penggunaan bahan | `bahan_id` → `bahan.id` |
| `laporan_kerusakan` | Laporan kerusakan alat | `alat_id` → `alat.id` |
| `laporan_praktikum` | Laporan praktikum | `jadwal_id` → `jadwal.id`, `lab_id` → `lab.id` |
| `pengajuan_jadwal` | Pengajuan jadwal dari publik | `lab_id` → `lab.id` |
| `peminjaman` | Peminjaman alat/sarana | `alat_id` → `alat.id`, `sarana_id` → `sarana.id` |
| `settings` | Pengaturan web | - |

### 5.3 Kolom Penting
- `alat` dan `sarana` memiliki kolom `spek` (VARCHAR 255).
- `bahan` memiliki `stok_awal` dan `stok_akhir` (DECIMAL 10,2), bukan `jumlah`.
- `jam_mulai` dan `jam_selesai` pada `jadwal`/`pengajuan_jadwal` adalah integer 1-10 (jam pelajaran).
- `pengajuan_jadwal` memiliki `processed_by` untuk mencatat nama admin yang memproses.

Skema lengkap tersedia di `backend/database/init.sql`.

---

## 6. Konvensi Kode

### 6.1 Format Response API
**Sukses:**
```json
{
  "success": true,
  "message": "OK",
  "data": ...
}
```

**Error:**
```json
{
  "success": false,
  "message": "Pesan error"
}
```

Gunakan helper `shared/utils/response.js`.

### 6.2 Autentikasi & Otorisasi
- Token JWT dikirim via header `Authorization: Bearer <token>`.
- `verifyToken` memeriksa token, payload disimpan di `req.user`.
- `requireRole('admin', 'laboran', ...)` untuk membatasi akses.
- Role: `admin`, `laboran`, `guru`.

### 6.3 Penamaan
- Nama file modul: lowercase, tanda hubung jika perlu (`laporan-kerusakan`).
- Nama fungsi controller: `getAll`, `create`, `update`, `remove`.
- Variabel camelCase.

### 6.4 Error Handling
Setiap controller wajib `try-catch`. Status 400 untuk validasi, 404 jika tidak ditemukan, 500 untuk server error.

### 6.5 Notifikasi WhatsApp
Fungsi di `shared/utils/whatsapp.js`:
- `sendWANotification(jadwal, action)`
- `sendWANotificationToAdmin(message)`
- `sendWANotificationToGuru(nomorWa, message)`

Environment variables: `TOKEN_FONNTE`, `ADMIN_WA`.

### 6.6 Upload File
Middleware upload tersedia di `shared/middleware/uploadPeminjaman.js`.
Gunakan `upload.single('foto')` pada route yang membutuhkan upload gambar (peminjaman). Folder tujuan: `frontend/uploads/peminjaman`.

---

## 7. Integrasi Chatbot

- Chatbot berjalan di `/opt/chatbot`, port 3000.
- Webhook dari Fonnte, menerima pesan dan merespons.
- Fitur:
  - Menu pengaduan/tiket (kategori, operator, tiket).
  - Handler `#jadwal` untuk pengajuan jadwal: parsing pesan → `POST /api/pengajuan` ke backend utama.
- Database chatbot: `chatbot` dengan tabel `operators`, `tickets`, `sessions`.

---

## 8. Menambah Modul Baru

1. Buat folder `backend/modules/nama-modul/`.
2. Isi tiga file: `nama-modul.routes.js`, `nama-modul.controller.js`, `nama-modul.service.js`.
3. Definisikan route, controller, service.
4. Tambahkan mounting di `app.js`:
   ```js
   app.use('/api/nama-modul', require('./modules/nama-modul/nama-modul.routes'));
   ```
5. Jangan ubah path atau method endpoint yang sudah ada.
6. Uji lokal sebelum push.

---

## 9. Contoh Modul `lab`

Lihat `backend/modules/lab/` yang sudah dibuat sebagai template.

```js
// lab.routes.js
const express = require('express');
const router = express.Router();
const labController = require('./lab.controller');
const verifyToken = require('../../shared/middleware/verifyToken');

router.get('/', labController.getAll);
router.post('/', verifyToken, labController.create);
router.put('/:id', verifyToken, labController.update);
router.delete('/:id', verifyToken, labController.remove);

module.exports = router;
```

Untuk `lab.controller.js` dan `lab.service.js`, silakan lihat langsung di folder `backend/modules/lab/` sebagai acuan.

---

Dokumen ini menjadi acuan utama pengembangan backend. Simpan di root repositori sebagai `ARCHITECTURE.md`.