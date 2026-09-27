# 📘 Arsitektur Proyek MUGALAB

Dokumen ini menjelaskan arsitektur, struktur, dan konvensi kode aplikasi MUGALAB.

> **Untuk langkah instalasi & konfigurasi server, lihat [`installation.md`](./installation.md).**

---

## 📋 Daftar Isi

1. [Gambaran Umum](#1-gambaran-umum)
2. [Arsitektur Sistem](#2-arsitektur-sistem)
3. [Struktur Folder](#3-struktur-folder)
4. [Daftar Endpoint API](#4-daftar-endpoint-api)
5. [Database](#5-database)
6. [Konvensi Kode](#6-konvensi-kode)
7. [Fitur Lampiran PDF pada Pengajuan Jadwal](#7-fitur-lampiran-pdf-pada-pengajuan-jadwal)
8. [Fitur Template Laporan Praktikum (DOCX → PDF)](#8-fitur-template-laporan-praktikum-docx--pdf)
9. [Fitur Role Permissions](#9-fitur-role-permissions)
10. [Fitur Peminjaman & Auto-Report Kerusakan](#10-fitur-peminjaman--auto-report-kerusakan)
11. [Integrasi Chatbot](#11-integrasi-chatbot)
12. [Menambah Modul Baru](#12-menambah-modul-baru)
13. [Contoh Modul `lab`](#13-contoh-modul-lab)
14. [Alur Deployment (Ringkas)](#14-alur-deployment-ringkas)
15. [Checklist Penambahan Fitur Baru](#15-checklist-penambahan-fitur-baru)

---

## 1. Gambaran Umum

MUGALAB adalah aplikasi manajemen laboratorium sekolah yang terdiri dari:

- **Frontend Publik** (`/frontend`) — halaman jadwal mingguan & pengajuan jadwal (termasuk upload PDF)
- **Dashboard** (`/dashboard`) — panel admin/laboran/guru untuk manajemen data
- **Backend** (`/backend`) — REST API utama (Express.js + MySQL)
- **Chatbot WhatsApp** (`/opt/chatbot` di VPS) — layanan webhook Fonnte untuk pengaduan dan pengajuan jadwal

### Lokasi di VPS

| Komponen | Path |
|----------|------|
| Web apps (frontend, dashboard, backend) | `/var/www/lab` |
| Chatbot | `/opt/chatbot` |

### Alur Deployment (Ringkas)

```
Laptop → push ke GitHub → git pull di VPS → npm install (jika perlu) → pm2 restart lab
```

> Detail lengkap ada di [`installation.md`](./installation.md) §16.

---

## 2. Arsitektur Sistem

```
[ Frontend Publik ]      [ Dashboard ]        [ Chatbot WhatsApp ]
        |                       |                        |
        | (upload PDF)          | (preview PDF)          | (webhook Fonnte)
        +-----------------------+------------------------+
                                |
                           [ Backend API ]
                       (Express, port 7000)
                                |
                       [ Database MySQL ]
                    (lab-db untuk backend,
                     chatbot untuk chatbot)
                                |
                       [ File Storage ]
                    (backend/uploads/...)
                                |
                            [ Nginx ]
                    (/uploads/ → file publik)
```

Backend menggunakan pola **modular monolith**: satu proses, satu database, tetapi kode dipisah ke dalam modul-modul berdasarkan domain bisnis.

---

## 3. Struktur Folder

### 3.1 Backend

```
backend/
├── server.js                  # Entry point, hanya listen
├── app.js                     # Setup Express, middleware, mount routes
├── package.json
├── .env
├── .env.example
├── config/
│   └── db.js                  # Koneksi pool MySQL
├── shared/
│   ├── middleware/
│   │   ├── verifyToken.js
│   │   ├── requireRole.js
│   │   ├── uploadPeminjaman.js  # Multer foto peminjaman
│   │   ├── uploadPengajuan.js   # Multer PDF pengajuan
│   │   └── uploadTemplate.js    # Multer DOCX template
│   ├── utils/
│   │   ├── response.js
│   │   ├── whatsapp.js
│   │   └── helpers.js
│   └── validators/
├── modules/
│   ├── auth/
│   ├── lab/
│   ├── jadwal/
│   ├── alat/
│   ├── bahan/
│   ├── sarana/
│   ├── laporan-kerusakan/       # Mendukung alat & sarana
│   ├── laporan-praktikum/
│   ├── pengajuan/
│   ├── peminjaman/              # Auto-report kerusakan
│   ├── user/
│   └── settings/
├── uploads/
│   ├── pengajuan/               # PDF lampiran pengajuan
│   ├── templates/               # Template DOCX laprak
│   ├── peminjaman/              # Foto pinjam & kembali
│   └── temp/                    # File sementara (docx → pdf)
└── database/
    └── init.sql
```

Setiap modul memiliki tiga file:

| File | Tanggung jawab |
|------|----------------|
| `*.routes.js` | Definisi endpoint + middleware auth/role |
| `*.controller.js` | Menangani request/response, memanggil service |
| `*.service.js` | Logika bisnis dan query database |

### 3.2 Frontend (Ringkas)

```
frontend/
├── index.html                 # Halaman publik
├── css/style.css
├── js/main.js
├── login/
│   └── login.html
├── dashboard/
│   ├── dashboard.html
│   ├── style.css
│   └── assets/js/
│       ├── core/
│       │   ├── app.js         # Sidebar (role-aware), hamburger, tabs
│       │   ├── apiClient.js
│       │   ├── auth.js
│       │   ├── modal.js
│       │   └── utils.js
│       ├── modules/
│       │   ├── setting/       # Panel Pengaturan (3 tab)
│       │   ├── lab/
│       │   ├── user/          # + Izin Akses per Role
│       │   ├── jadwal/
│       │   ├── inventaris/    # alat.js, bahan.js, sarana.js
│       │   ├── laporanKerusakan/
│       │   ├── riwayatBahan/
│       │   ├── laprak/
│       │   ├── pengajuan/
│       │   └── peminjaman/
│       └── main.js
└── uploads/                   # (Legacy, sudah tidak dipakai)
```

> **Catatan:** Folder `frontend/uploads/` sudah tidak dipakai lagi. Semua upload (foto peminjaman, PDF pengajuan, template DOCX) kini disimpan di `backend/uploads/` agar dilayani langsung oleh Nginx.

### 3.3 Panel Pengaturan Dashboard

Panel **Pengaturan** (`#setting`) adalah satu-satunya tempat untuk mengelola konfigurasi web, ruangan lab, dan user — dan **hanya dapat diakses oleh role `admin`**.

#### Struktur Tab

| Tab | Icon | Isi | File |
|-----|------|-----|------|
| Umum | ⚙️ | Nama sekolah, nama lab, upload template DOCX | `modules/setting/setting.js` |
| Ruangan Lab | 🏫 | CRUD ruangan laboratorium | `modules/lab/lab.js` |
| Manajemen User | 👥 | CRUD user + **Izin Akses per Role** | `modules/user/user.js` |

#### Manajemen User — Dua Section

Tab Manajemen User memiliki **dua section** yang ditampilkan berurutan:

1. **👥 Daftar Pengguna** — tabel user (username, nama, role, aksi edit/hapus).
2. **🔐 Izin Akses per Role** — chip-toggle per panel; klik chip untuk toggle aktif/non-aktif. Lihat §9.

#### Perubahan Struktur Menu

- Menu **Kelola Ruangan Lab** dan **Manajemen User** dihapus dari sidebar.
- Menu hanya menampilkan `Pengaturan` (bagi admin), dan kontennya dipecah ke dalam tab.
- `menuRules` di `core/app.js` bersifat **dinamis** — dibaca dari endpoint `/api/settings/role-permissions` saat halaman dimuat.

#### Backend

Tidak ada perubahan endpoint untuk pengaturan umum. Panel Pengaturan memanggil:

- `/api/settings` (GET, PUT)
- `/api/settings/template` (POST)
- `/api/lab` (GET, POST, PUT, DELETE)
- `/api/users` (GET, POST, PUT, DELETE)
- `/api/settings/role-permissions` (GET, PUT)

---

## 4. Daftar Endpoint API

### Auth — `/api/auth`

| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| POST | `/api/auth/login` | Login, mendapatkan JWT | Publik |

### Lab — `/api/lab`

| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/lab` | Ambil semua lab | Publik |
| POST | `/api/lab` | Tambah lab | Auth (admin/laboran) |
| PUT | `/api/lab/:id` | Edit lab | Auth (admin/laboran) |
| DELETE | `/api/lab/:id` | Hapus lab (cek referensi) | Auth (admin) |

### Jadwal — `/api/jadwal`

| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/jadwal/public` | Jadwal publik mingguan | Publik |
| GET | `/api/jadwal` | Jadwal dashboard | Auth |
| POST | `/api/jadwal` | Tambah jadwal + notif WA | Auth (admin/laboran) |
| PUT | `/api/jadwal/:id` | Edit jadwal + notif WA | Auth (admin/laboran) |
| DELETE | `/api/jadwal/:id` | Hapus jadwal | Auth (admin/laboran) |

### Alat — `/api/alat`

| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/alat` | Ambil semua alat (sertakan field `dipinjam`) | Auth |
| POST | `/api/alat` | Tambah alat | Auth (admin/laboran) |
| PUT | `/api/alat/:id` | Edit alat | Auth (admin/laboran) |
| DELETE | `/api/alat/:id` | Hapus alat | Auth (admin/laboran) |

### Bahan — `/api/bahan`

| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/bahan` | Ambil daftar bahan | Auth |
| POST | `/api/bahan` | Tambah bahan | Auth (admin/laboran) |
| PUT | `/api/bahan/:id` | Edit bahan | Auth (admin/laboran) |
| DELETE | `/api/bahan/:id` | Hapus bahan | Auth (admin/laboran) |
| POST | `/api/bahan/pakai` | Catat penggunaan bahan | Auth (admin/laboran) |
| GET | `/api/bahan/pakai` | Riwayat penggunaan | Auth |
| DELETE | `/api/bahan/pakai/:id` | Hapus riwayat | Auth (admin/laboran) |

### Sarana — `/api/sarana`

| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/sarana` | Ambil semua sarana (sertakan `dipinjam`) | Auth |
| POST | `/api/sarana` | Tambah sarana | Auth (admin/laboran) |
| PUT | `/api/sarana/:id` | Edit sarana | Auth (admin/laboran) |
| DELETE | `/api/sarana/:id` | Hapus sarana | Auth (admin/laboran) |

### Laporan Kerusakan — `/api/laporan-kerusakan`

Mendukung **alat** dan **sarana** dalam satu tabel.

| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/laporan-kerusakan` | Ambil semua laporan (alat & sarana) | Auth |
| POST | `/api/laporan-kerusakan` | Buat laporan, kurangi stok item | Auth (admin/laboran) |
| PUT | `/api/laporan-kerusakan/:id` | Update status (`rusak`/`diperbaiki`/`selesai`/`dibuang`) | Auth (admin/laboran) |
| DELETE | `/api/laporan-kerusakan/:id` | Hapus laporan, koreksi stok | Auth (admin/laboran) |

**Body POST:**

```json
{
  "jenis": "alat" | "sarana",
  "item_id": 1,
  "jumlah_rusak": 1,
  "pelapor": "Nama",
  "tanggal_lapor": "2026-09-20",
  "keterangan": "opsional"
}
```

> **Backward compatible:** field `alat_id` lama masih diterima untuk kompatibilitas.

### Laporan Praktikum — `/api/laporan-praktikum`

| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/laporan-praktikum` | Ambil semua laporan | Auth |
| POST | `/api/laporan-praktikum` | Buat laporan praktikum | Auth |
| PUT | `/api/laporan-praktikum/:id` | Edit laporan | Auth (admin/laboran) |
| DELETE | `/api/laporan-praktikum/:id` | Hapus laporan | Auth (admin/laboran) |
| GET | `/api/laporan-praktikum/:id/pdf` | Generate & unduh PDF | Auth |

### Pengajuan Jadwal — `/api/pengajuan`

| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/pengajuan` | Ambil semua pengajuan | Auth |
| POST | `/api/pengajuan` | Kirim pengajuan (multipart, opsional `file_pdf`) | Publik |
| PUT | `/api/pengajuan/:id` | Terima/tolak pengajuan | Auth (admin/laboran) |

### Peminjaman — `/api/peminjaman`

| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/peminjaman` | Ambil daftar peminjaman | Auth |
| POST | `/api/peminjaman` | Pinjam alat/sarana (multipart `foto`) | Auth |
| PUT | `/api/peminjaman/:id/kembali` | Kembalikan; auto-lapor jika rusak | Auth (admin/laboran) |

### User — `/api/users`

| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/users` | Ambil semua user | Auth (admin) |
| POST | `/api/users` | Tambah user | Auth (admin) |
| PUT | `/api/users/:id` | Edit user | Auth (admin) |
| DELETE | `/api/users/:id` | Hapus user | Auth (admin) |

### Settings — `/api/settings`

| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/settings/public` | Pengaturan publik | Publik |
| GET | `/api/settings` | Ambil semua pengaturan | Auth (admin) |
| PUT | `/api/settings` | Update pengaturan | Auth (admin) |
| POST | `/api/settings/template` | Upload template DOCX | Auth (admin) |
| GET | `/api/settings/role-permissions` | Ambil izin per role | Auth |
| PUT | `/api/settings/role-permissions` | Update izin per role | Auth (admin) |

### File Statis — `/uploads/`

| Path | Deskripsi | Akses |
|------|-----------|-------|
| `/uploads/pengajuan/<file>` | PDF lampiran pengajuan | Publik (via Nginx) |
| `/uploads/peminjaman/<file>` | Foto pinjam & kembali | Auth (via Nginx) |
| `/uploads/templates/<file>` | Template DOCX laprak | Auth |

---

## 5. Database

### 5.1 Nama Database

| Database | Digunakan oleh |
|----------|----------------|
| `lab-db` | Backend utama |
| `chatbot` | Chatbot WhatsApp |

### 5.2 Tabel Utama

| Tabel | Deskripsi | Relasi |
|-------|-----------|--------|
| `lab` | Ruang laboratorium | — |
| `users` | Pengguna dashboard | — |
| `jadwal` | Jadwal kegiatan | `lab_id` → `lab.id` |
| `alat` | Inventaris alat | `lab_id` → `lab.id` |
| `bahan` | Inventaris bahan | `lab_id` → `lab.id` |
| `sarana` | Inventaris sarana | `lab_id` → `lab.id` |
| `penggunaan_bahan` | Riwayat penggunaan bahan | `bahan_id` → `bahan.id` |
| `laporan_kerusakan` | Laporan kerusakan **alat & sarana** | `alat_id` (NULL) → `alat.id`, `sarana_id` (NULL) → `sarana.id` |
| `laporan_praktikum` | Laporan praktikum | `jadwal_id` → `jadwal.id`, `lab_id` → `lab.id` |
| `pengajuan_jadwal` | Pengajuan jadwal dari publik | `lab_id` → `lab.id` |
| `peminjaman` | Peminjaman alat/sarana | `alat_id`/`sarana_id` → tabel terkait |
| `settings` | Pengaturan web (key-value) | — |

### 5.3 Kolom Penting

- `alat` dan `sarana`:
  - `spek` (VARCHAR 255).
  - `jumlah` = stok **tersedia** (available). Dikurangi otomatis saat peminjaman dibuat.
  - `jumlah_rusak` = jumlah yang berstatus rusak.
  - **`dipinjam` (computed)** — **bukan kolom DB**, tapi field hasil subquery: total `peminjaman.jumlah` dengan `status='dipinjam'` untuk item tersebut. Total fisik = `jumlah + dipinjam + jumlah_rusak`.
- `bahan`: `stok_awal` & `stok_akhir` (DECIMAL 10,2), bukan `jumlah`.
- `jam_mulai` & `jam_selesai` pada `jadwal`/`pengajuan_jadwal`: integer 1–10 (jam pelajaran).
- `pengajuan_jadwal`: `processed_by`, `processed_at`, `file_pdf` (VARCHAR 255, NULL).
- `laporan_kerusakan`:
  - `jenis` (ENUM `alat`/`sarana`) — diskriminator.
  - `alat_id` (INT, NULL) — diisi jika `jenis='alat'`.
  - `sarana_id` (INT, NULL) — diisi jika `jenis='sarana'`.
- `settings`:
  - Menyimpan `nama_sekolah`, `nama_lab` sebagai key-value.
  - Menyimpan `role_permissions` sebagai JSON string.

Skema lengkap tersedia di `backend/database/init.sql`.

---

## 6. Konvensi Kode

### 6.1 Format Response API

**Sukses:**

```json
{
  "success": true,
  "message": "OK",
  "data": {}
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

> **Catatan:** Semua pemanggilan `apiGet`, `apiPost`, `apiPut`, `apiDelete` di frontend harus membaca `.data`:
>
> ```js
> const data = Array.isArray(response) ? response : (response.data || []);
> ```

### 6.2 Autentikasi & Otorisasi

- Token JWT dikirim via header `Authorization: Bearer <token>`.
- `verifyToken` memverifikasi token, payload disimpan di `req.user`.
- `requireRole('admin', 'laboran', ...)` membatasi akses.
- Role: `admin`, `laboran`, `guru`.

### 6.3 Penamaan

- Nama file modul: lowercase, dash jika perlu (`laporan-kerusakan`).
- Fungsi controller: `getAll`, `create`, `update`, `remove`.
- Variabel: camelCase.

### 6.4 Error Handling

| Kode | Kondisi |
|------|---------|
| 400 | Validasi gagal |
| 401 | Tidak terautentikasi |
| 403 | Tidak memiliki akses |
| 404 | Data tidak ditemukan |
| 500 | Server error |

### 6.5 Notifikasi WhatsApp

Fungsi di `shared/utils/whatsapp.js`:

- `sendWANotification(jadwal, action)`
- `sendWANotificationToAdmin(message)`
- `sendWANotificationToGuru(nomorWa, message)`

Environment: `TOKEN_FONNTE`, `ADMIN_WA`.

> **Tips:** Pastikan `TOKEN_FONNTE` identik dengan yang aktif di dashboard Fonnte. Jika gagal `invalid token`, periksa spasi/newline di `.env`.

### 6.6 Upload File

| Middleware | Field | Folder tujuan |
|------------|-------|---------------|
| `uploadPeminjaman.js` | `upload.single('foto')` | `backend/uploads/peminjaman/` |
| `uploadPengajuan.js` | `upload.single('file_pdf')` | `backend/uploads/pengajuan/` |
| `uploadTemplate.js` | `upload.single('file')` | `backend/uploads/templates/laprak-template.docx` (overwrite) |

**Akses file publik:**

```
https://lab.mugalearning.web.id/uploads/<folder>/<file>
```

Contoh: `https://lab.mugalearning.web.id/uploads/peminjaman/1790507730771-540877342.webp`

Konfigurasi Nginx (detail di [`installation.md`](./installation.md) §9):

```nginx
location /uploads/ {
    alias /var/www/lab/backend/uploads/;
    autoindex off;
    add_header Content-Disposition "inline";
}
```

### 6.7 Gitignore untuk Folder Uploads

Folder `backend/uploads/` di-ignore isinya, tetapi foldernya tetap ter-track karena ada file `.gitkeep`:

```gitignore
backend/uploads/**/*
!backend/uploads/**/.gitkeep
```

Root `.gitignore` juga mengabaikan `.env`, `node_modules/`, dan `.pm2/`.

---

## 7. Fitur Lampiran PDF pada Pengajuan Jadwal

Fitur ini memungkinkan guru/pemohon mengunggah proposal dalam format PDF saat mengajukan jadwal. Lampiran dapat dilihat oleh admin, laboran, dan guru.

### 7.1 Alur

1. **Guru** membuka halaman publik, klik sel kosong di tabel jadwal.
2. Modal pengajuan muncul, isi form, pilih file PDF pada **Lampiran Proposal (PDF)**.
3. Frontend mengirim via `FormData` (bukan JSON) ke `POST /api/pengajuan`.
4. Backend memproses dengan `uploadPengajuan` → disimpan di `backend/uploads/pengajuan/`.
5. Nama file disimpan di kolom `file_pdf` tabel `pengajuan_jadwal`.
6. Notifikasi WA ke admin menyertakan `📄 Lampiran PDF: Ya` jika ada file.
7. **Admin/Laboran/Guru** membuka dashboard → menu **Pengajuan Jadwal** → kolom **Lampiran** menampilkan tombol **📄 PDF**.
8. Klik tombol → modal preview PDF muncul dengan `iframe`.

### 7.2 Ketentuan File

| Aspek | Nilai |
|-------|-------|
| Format | Hanya PDF (`application/pdf`) |
| Ukuran maksimal | 5 MB |
| Nama file | `pengajuan-<timestamp>-<random>.pdf` |
| Folder | `backend/uploads/pengajuan/` |
| Wajib | Tidak (chatbot tidak mengirim file) |
| Kolom DB | `pengajuan_jadwal.file_pdf` (VARCHAR 255, NULL) |

### 7.3 Frontend Publik — UI Upload

- Area dashed dengan ikon PDF, efek hover, transisi halus.
- **Drag & drop**.
- Preview nama + ukuran file.
- Tombol hapus (X) untuk reset.
- Validasi tipe & ukuran sebelum kirim.
- Fungsi `resetUpload()` dipanggil saat modal ditutup/dibuka.

**File terkait:**

| File | Bagian |
|------|--------|
| `frontend/index.html` | Markup upload area |
| `frontend/css/style.css` | `.upload-area`, `.upload-preview`, `.upload-remove` |
| `frontend/js/main.js` | Handler upload & submit |

### 7.4 Dashboard — Kolom Lampiran

- Kolom **Lampiran** di tabel pengajuan.
- Hanya muncul untuk role `admin`, `laboran`, dan `guru`.
- Tombol **📄 PDF** muncul jika `file_pdf` tidak NULL.
- Klik → modal preview PDF dinamis.
- Untuk role `guru`, kolom **Aksi** tidak menampilkan tombol Terima/Tolak.

**File terkait:**

| File | Bagian |
|------|--------|
| `frontend/dashboard/assets/js/modules/pengajuan/pengajuan.js` | Render & preview |
| `frontend/dashboard/style.css` | `.btn-pdf` |

### 7.5 Migrasi Database

Jika tabel `pengajuan_jadwal` belum punya kolom `file_pdf`:

```sql
ALTER TABLE pengajuan_jadwal
ADD COLUMN file_pdf VARCHAR(255) NULL AFTER kelas;
```

### 7.6 Testing

```bash
curl -X POST http://localhost:7000/api/pengajuan \
  -F "pengaju=Test" -F "nomor_wa=6281234567890" \
  -F "penanggung_jawab=Test PJ" -F "kegiatan=Test" \
  -F "tanggal=2026-09-20" -F "jam_mulai=1" -F "jam_selesai=2" \
  -F "lab_id=1" -F "file_pdf=@/path/ke/file.pdf"
```

---

## 8. Fitur Template Laporan Praktikum (DOCX → PDF)

Admin mengunggah template laporan praktikum (DOCX); guru mengunduh laporan yang sudah terisi sebagai PDF.

### 8.1 Alur

1. **Admin** upload `.docx` via panel Pengaturan → tab Umum.
2. Disimpan sebagai `backend/uploads/templates/laprak-template.docx`.
3. **Guru** klik tombol PDF pada laporan praktikum.
4. **Backend** (`laporan-praktikum.pdf.service.js`):
   - Ambil data laporan dari database.
   - Ambil `nama_sekolah` & `nama_lab` dari `settings`.
   - Baca template DOCX dengan `pizzip` + `docxtemplater`.
   - Isi placeholder.
   - Simpan DOCX sementara di `backend/uploads/temp/`.
   - Konversi ke PDF via **LibreOffice headless**.
   - Kirim PDF, hapus file sementara.

### 8.2 Placeholder Template DOCX

| Placeholder | Data |
|-------------|------|
| `{{NAMA_LAB}}` | Nama lab dari settings |
| `{{NAMA_SEKOLAH}}` | Nama sekolah dari settings |
| `{{MATA_PELAJARAN}}` | Mata pelajaran |
| `{{JUDUL}}` | Judul praktikum |
| `{{KELAS}}` | Kelas |
| `{{JUMLAH_KELOMPOK}}` | Jumlah kelompok |
| `{{TANGGAL}}` | Tanggal praktikum (format Indonesia) |
| `{{TANGGAL_TTD}}` | Tanggal tanda tangan |
| `{{RUANG_LAB}}` | Nama ruang lab |
| `{{JAM}}` | Jam mulai–selesai |
| `{{GURU}}` | Nama guru pengampu |
| `{{TUJUAN}}` | Tujuan praktikum |
| `{{ALAT}}` | Daftar alat (satu per baris) |
| `{{BAHAN}}` | Daftar bahan (satu per baris) |
| `{{DESKRIPSI}}` | Deskripsi kegiatan |

### 8.3 Dependensi

- **Node.js**: `docxtemplater`, `pizzip`, `multer`.
- **Sistem**: **LibreOffice** (wajib).

> Tanpa LibreOffice, `GET /api/laporan-praktikum/:id/pdf` gagal dengan `libreoffice: not found`. Instalasi di [`installation.md`](./installation.md) §2.7.

---

## 9. Fitur Role Permissions

Fitur ini memungkinkan admin mengatur panel apa saja yang bisa diakses setiap role **tanpa mengubah kode**. Dikelola dari dalam tab **Manajemen User** di panel Pengaturan.

### 9.1 Konsep

- Konfigurasi disimpan di tabel `settings` dengan key `role_permissions`.
- Value berupa JSON:

```json
{
  "admin":   ["jadwal","inventaris","laporan","riwayat","laporan-praktikum","pengajuan","peminjaman","setting"],
  "laboran": ["jadwal","inventaris","laporan","riwayat","laporan-praktikum","pengajuan","peminjaman"],
  "guru":    ["jadwal","inventaris","laporan","riwayat","laporan-praktikum","peminjaman"]
}
```

### 9.2 UI — Section "Izin Akses per Role"

Berada di bawah tabel user, dalam tab Manajemen User:

- Tiga card: 👑 Administrator, 🔬 Laboran, 👨‍🏫 Guru.
- Setiap card berisi chip-toggle per panel.
- Chip `active` (hijau muda) = panel aktif untuk role tersebut.
- Chip `locked` (dengan 🔒) = tidak bisa dimatikan (hanya `setting` pada `admin`).
- Tombol **💾 Simpan** di kanan atas section.

### 9.3 Alur Data

```
1. Admin buka tab Manajemen User
2. loadRolePermissions() → GET /api/settings/role-permissions
3. Admin klik-klik chip
4. Klik Simpan → PUT /api/settings/role-permissions
5. Backend validasi:
   - 3 role (admin/laboran/guru) harus ada
   - admin wajib include 'setting'
6. Simpan ke settings.role_permissions
7. Frontend panggil initSidebar() → sidebar refresh
```

### 9.4 Sidebar Dinamis

Di `core/app.js`, fungsi `initSidebar()` menjadi **async** dan membaca permission dari server:

```js
async function initSidebar() {
    const role = localStorage.getItem('role') || 'guru';
    let allowedPanels = [];
    try {
        const res = await apiGet('/api/settings/role-permissions');
        const perms = res.data || res;
        allowedPanels = perms[role] || [];
    } catch (err) {
        allowedPanels = FALLBACK[role] || FALLBACK.guru;
    }
    // ...filter sidebar berdasarkan allowedPanels...
}
```

Fallback default dipakai jika API tidak tersedia (mis. user offline).

### 9.5 Keamanan (Penting)

Fitur ini **hanya menyembunyikan menu di frontend**. Endpoint API masih bisa diakses langsung oleh user yang tahu URL-nya (mis. guru bisa hit `GET /api/users` via curl).

Jika perlu **backend juga membatasi**, itu membutuhkan middleware `requireRole` dinamis yang membaca dari DB — belum diimplementasikan.

### 9.6 File Terkait

| File | Bagian |
|------|--------|
| `backend/modules/settings/settings.service.js` | `getRolePermissions`, `updateRolePermissions` |
| `backend/modules/settings/settings.controller.js` | 2 controller baru |
| `backend/modules/settings/settings.routes.js` | `GET/PUT /role-permissions` |
| `frontend/.../core/app.js` | `initSidebar()` async |
| `frontend/.../modules/user/user.js` | `loadRolePermissions`, `saveRolePermissions` |
| `frontend/dashboard/dashboard.html` | Section `role-permissions-section` |
| `frontend/dashboard/style.css` | `.role-chip`, `.role-permission-card` |

---

## 10. Fitur Peminjaman & Auto-Report Kerusakan

### 10.1 Alur Peminjaman

1. User klik **+ Pinjam** di panel Peminjaman.
2. Isi form, pilih item (alat/sarana), upload foto (kamera, auto-kompres WebP max 800px).
3. Frontend kirim `FormData` ke `POST /api/peminjaman`.
4. Backend:
   - Cek stok tersedia.
   - INSERT ke `peminjaman`.
   - **`kurangiStok()`** — kurangi `jumlah` pada `alat`/`sarana`.
5. Setelah sukses, frontend refresh `loadPeminjaman()`, `loadAlat()`, `loadSarana()`.

### 10.2 Stok Tersedia & Dipinjam

Kolom **Jumlah** di panel Inventaris menampilkan:

```
9                 ← stok tersedia (available)
1 dipinjam        ← teks oranye, hanya muncul jika > 0
1 rusak           ← teks merah, hanya muncul jika > 0
```

Field `dipinjam` **bukan kolom DB** — dihitung via subquery di `alat.service.js` & `sarana.service.js`:

```sql
SELECT a.*,
    COALESCE((
        SELECT SUM(p.jumlah) FROM peminjaman p
        WHERE p.alat_id = a.id AND p.status = 'dipinjam'
    ), 0) AS dipinjam
FROM alat a
```

**Alasan computed:** menghindari drift stok. `jumlah` di DB selalu = tersedia; total fisik = `jumlah + dipinjam + jumlah_rusak`.

### 10.3 Pengembalian & Auto-Report Kerusakan

Saat user klik **Kembalikan**:

1. Form isi `jumlah_rusak` (default 0) + upload foto kondisi.
2. `PUT /api/peminjaman/:id/kembali`:
   - Update status peminjaman → `dikembalikan`.
   - **`kembalikanStok()`** → `jumlah += (jumlah_pinjam - jumlah_rusak)`, `jumlah_rusak += jumlah_rusak`.
   - **Jika `jumlah_rusak > 0`** → auto INSERT ke `laporan_kerusakan` (berlaku untuk **alat maupun sarana**).
3. Laporan otomatis muncul di panel Laporan Kerusakan dengan `jenis` sesuai.

### 10.4 Status Laporan Kerusakan & Efeknya ke Stok

| Aksi | `jumlah` | `jumlah_rusak` |
|------|----------|----------------|
| Lapor rusak (n unit) | −n | +n |
| **Selesai** (perbaikan sukses) | +n | −n |
| **Dibuang** (fisik keluar inventaris) | tetap | −n |
| **Hapus** laporan (masih rusak/diperbaiki) | +n | −n |
| **Hapus** laporan (sudah dibuang) | tetap | tetap |

### 10.5 File Terkait

| File | Bagian |
|------|--------|
| `backend/modules/peminjaman/peminjaman.service.js` | `kurangiStok`, `kembalikanStok`, `laporKerusakan` |
| `backend/modules/peminjaman/peminjaman.controller.js` | `pinjam`, `kembali` |
| `backend/modules/alat/alat.service.js` | `getAll` dengan subquery `dipinjam` |
| `backend/modules/sarana/sarana.service.js` | `getAll` dengan subquery `dipinjam` |
| `backend/modules/laporan-kerusakan/laporan-kerusakan.service.js` | `kurangiStok`, `kembalikanStok`, `kurangiJumlahRusak` |
| `frontend/.../inventaris/alat.js` | Render kolom Jumlah |
| `frontend/.../inventaris/sarana.js` | Render kolom Jumlah |
| `frontend/.../peminjaman/peminjaman.js` | `submitPinjam`, `submitKembali` |

---

## 11. Integrasi Chatbot

- Chatbot berjalan di `/opt/chatbot`, port 3000.
- Menerima webhook dari Fonnte.
- Fitur:
  - Menu pengaduan/tiket.
  - Handler `#jadwal` untuk pengajuan jadwal (parsing → `POST /api/pengajuan`).
- Karena chatbot mengirim JSON (bukan multipart), pengajuan dari chatbot **tidak menyertakan lampiran PDF** (`file_pdf = NULL`).
- Database chatbot: `chatbot`, tabel `operators`, `tickets`, `sessions`.

---

## 12. Menambah Modul Baru

1. Buat folder `backend/modules/nama-modul/`.
2. Isi tiga file: `*.routes.js`, `*.controller.js`, `*.service.js`.
3. Definisikan route, controller, service.
4. Mount di `app.js`:
   ```js
   app.use('/api/nama-modul', require('./modules/nama-modul/nama-modul.routes'));
   ```
5. **Jangan ubah** path atau method endpoint yang sudah ada.
6. Uji lokal sebelum push.

---

## 13. Contoh Modul `lab`

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

Untuk `lab.controller.js` & `lab.service.js`, lihat `backend/modules/lab/`.

---

## 14. Alur Deployment (Ringkas)

1. **Di laptop:** tulis kode → commit → push ke GitHub.
2. **Di VPS:** SSH.
3. **Pull:**
   ```bash
   cd /var/www/lab
   git fetch --all
   git reset --hard origin/main
   ```
4. **Install dependensi Node.js (jika `package.json` berubah):**
   ```bash
   cd backend && npm install
   ```
5. **Jalankan migrasi DB (jika ada perubahan skema).**
6. **Restart aplikasi:**
   ```bash
   pm2 restart lab
   ```
7. **Jika ada perubahan dependensi sistem**, install manual di VPS.

> ⚠️ **Jangan pernah mengedit langsung di VPS.** Semua melalui GitHub.

> Detail lengkap di [`installation.md`](./installation.md) §16.

---

## 15. Checklist Penambahan Fitur Baru

Saat menambahkan fitur yang melibatkan upload file atau data baru:

- [ ] Skema database diperbarui (tambah kolom/tabel).
- [ ] Migrasi SQL ditulis & dijalankan di semua VPS.
- [ ] Middleware upload dibuat (jika perlu).
- [ ] Route/controller/service disesuaikan.
- [ ] Folder upload dibuat + diberi izin (`chown adminlab:www-data`, `chmod 775`).
- [ ] Konfigurasi Nginx ditambahkan (jika file diakses publik).
- [ ] Frontend diperbarui (UI + `FormData`).
- [ ] Role-based access control diperiksa.
- [ ] Jika fitur baru = panel baru, tambahkan ke `ALL_PANELS` di `user.js` (untuk Role Permissions).
- [ ] Notifikasi WA disesuaikan (jika ada).
- [ ] Testing end-to-end.
- [ ] Dokumentasi ini diperbarui.