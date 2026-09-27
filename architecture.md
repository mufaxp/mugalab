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
9. [Integrasi Chatbot](#9-integrasi-chatbot)
10. [Menambah Modul Baru](#10-menambah-modul-baru)
11. [Contoh Modul `lab`](#11-contoh-modul-lab)
12. [Alur Deployment (Ringkas)](#12-alur-deployment-ringkas)
13. [Checklist Penambahan Fitur Baru](#13-checklist-penambahan-fitur-baru)

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
Laptop → push ke GitHub → git pull di VPS → npm install (jika perlu) → pm2 restart mugalab-backend
```

> Detail lengkap ada di [`installation.md`](./installation.md) §15.

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
                     chatbot-db untuk chatbot)
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
├── package.json               # Dependensi & script start
├── .env
├── .env.example
├── config/
│   └── db.js                  # Koneksi pool MySQL
├── shared/
│   ├── middleware/
│   │   ├── verifyToken.js       # Verifikasi JWT
│   │   ├── requireRole.js       # Pembatasan akses berdasarkan role
│   │   ├── uploadPeminjaman.js  # Multer untuk upload foto peminjaman
│   │   ├── uploadPengajuan.js   # Multer untuk upload PDF pengajuan jadwal
│   │   ├── uploadTemplate.js    # Multer untuk upload template DOCX
│   │   └── cors.js              # (opsional, saat ini belum dibuat)
│   ├── utils/
│   │   ├── response.js        # Format respons standar API
│   │   ├── whatsapp.js        # Notifikasi WA via Fonnte
│   │   └── helpers.js         # Fungsi bantu (getNamaFromToken, dll.)
│   └── validators/            # Validasi input (opsional)
├── modules/
│   ├── auth/
│   ├── lab/
│   ├── jadwal/
│   ├── alat/
│   ├── bahan/
│   ├── sarana/
│   ├── laporan-kerusakan/
│   ├── laporan-praktikum/
│   │   └── laporan-praktikum.pdf.service.js  # Generate PDF dari template DOCX
│   ├── pengajuan/                # Menerima upload PDF dari publik/chatbot
│   ├── peminjaman/
│   ├── user/
│   └── settings/
├── uploads/
│   ├── pengajuan/             # File PDF lampiran pengajuan jadwal
│   ├── templates/             # Template DOCX untuk laporan praktikum
│   └── temp/                  # File sementara (docx sebelum dikonversi PDF)
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
├── index.html                 # Halaman publik (jadwal + modal pengajuan)
├── css/style.css
├── js/main.js
├── login/
│   └── login.html
├── dashboard/                 # SPA panel admin
│   ├── dashboard.html
│   ├── style.css
│   └── assets/js/
│       ├── core/
│       │   ├── app.js         # Sidebar, hamburger, tabs, filter role
│       │   ├── apiClient.js   # Wrapper fetch (apiGet/apiPost/apiPut/apiDelete)
│       │   ├── auth.js        # Login, logout, cek token & role
│       │   ├── modal.js       # Helper openModal/closeModal
│       │   └── utils.js
│       ├── modules/
│       │   ├── setting/       # Panel Pengaturan (3 tab: Umum, Lab, User)
│       │   ├── lab/           # CRUD ruangan lab (dipakai dari tab Pengaturan)
│       │   ├── user/          # CRUD user (dipakai dari tab Pengaturan)
│       │   ├── jadwal/
│       │   ├── inventaris/
│       │   ├── laporanKerusakan/
│       │   ├── riwayatBahan/
│       │   ├── laprak/
│       │   ├── pengajuan/
│       │   └── peminjaman/
│       └── main.js            # Orchestrator: init semua modul
└── uploads/
    └── peminjaman/            # Foto peminjaman (dari dashboard)
```

### 3.3 Panel Pengaturan Dashboard

Panel **Pengaturan** (`#setting`) adalah satu-satunya tempat untuk mengelola konfigurasi web, ruangan lab, dan user — dan **hanya dapat diakses oleh role `admin`**.

#### Struktur Tab

| Tab | Icon | Isi | File |
|-----|------|-----|------|
| Umum | ⚙️ | Nama sekolah, nama lab, upload template DOCX laporan praktikum | `modules/setting/setting.js` |
| Ruangan Lab | 🏫 | CRUD ruangan laboratorium | `modules/lab/lab.js` |
| Manajemen User | 👥 | CRUD user (tambah, edit, hapus, ganti password) | `modules/user/user.js` |

#### Perubahan Struktur Menu

- Menu **Kelola Ruangan Lab** dan **Manajemen User** **dihapus** dari sidebar utama.
- Kedua fungsi tersebut dipindahkan ke dalam panel Pengaturan sebagai tab.
- `menuRules` di `core/app.js` untuk role `admin` hanya berisi: `jadwal`, `inventaris`, `laporan`, `riwayat`, `laporan-praktikum`, `pengajuan`, `peminjaman`, `setting`.

#### Cara Kerja Tab

- Tab menggunakan class `.settings-tab` dan panel `.settings-panel`.
- Fungsi `activateSettingsTab(tabName)` di `setting.js`:
  - Mengaktifkan tab & panel yang sesuai.
  - **Lazy-load** data: memanggil `loadLabData()` saat tab `lab` dibuka, dan `loadUser()` saat tab `user` dibuka.
- Modal `#modalLab` dan `#modalUser` **tidak berubah** dan tetap berada di luar `.main-area`.

#### Backend

Tidak ada perubahan endpoint. Panel Pengaturan tetap memanggil:

- `/api/settings` (GET, PUT)
- `/api/settings/template` (POST)
- `/api/lab` (GET, POST, PUT, DELETE)
- `/api/users` (GET, POST, PUT, DELETE)

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
| POST | `/api/lab` | Tambah lab | Auth (non-guru) |
| PUT | `/api/lab/:id` | Edit lab | Auth (non-guru) |
| DELETE | `/api/lab/:id` | Hapus lab (cek referensi) | Auth (admin) |

### Jadwal — `/api/jadwal`

| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/jadwal/public` | Jadwal publik mingguan | Publik |
| GET | `/api/jadwal` | Jadwal dashboard (`minggu_mulai`, `lab_id`) | Auth |
| POST | `/api/jadwal` | Tambah jadwal + notif WA | Auth (non-guru) |
| PUT | `/api/jadwal/:id` | Edit jadwal + notif WA | Auth (non-guru) |
| DELETE | `/api/jadwal/:id` | Hapus jadwal | Auth (non-guru) |

### Alat — `/api/alat`

| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/alat` | Ambil daftar alat (filter lab) | Auth |
| POST | `/api/alat` | Tambah alat | Auth (non-guru) |
| PUT | `/api/alat/:id` | Edit alat | Auth (non-guru) |
| DELETE | `/api/alat/:id` | Hapus alat | Auth (non-guru) |

### Bahan — `/api/bahan`

| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/bahan` | Ambil daftar bahan | Auth |
| POST | `/api/bahan` | Tambah bahan | Auth (non-guru) |
| PUT | `/api/bahan/:id` | Edit bahan | Auth (non-guru) |
| DELETE | `/api/bahan/:id` | Hapus bahan | Auth (non-guru) |
| POST | `/api/bahan/pakai` | Catat penggunaan bahan | Auth (non-guru) |
| GET | `/api/bahan/pakai` | Riwayat penggunaan bahan | Auth |
| DELETE | `/api/bahan/pakai/:id` | Hapus riwayat penggunaan | Auth (non-guru) |

### Sarana — `/api/sarana`

| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/sarana` | Ambil daftar sarana | Auth |
| POST | `/api/sarana` | Tambah sarana | Auth (non-guru) |
| PUT | `/api/sarana/:id` | Edit sarana | Auth (non-guru) |
| DELETE | `/api/sarana/:id` | Hapus sarana | Auth (non-guru) |

### Laporan Kerusakan — `/api/laporan-kerusakan`

| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/laporan-kerusakan` | Ambil semua laporan (join alat) | Auth |
| POST | `/api/laporan-kerusakan` | Buat laporan, kurangi stok alat | Auth (non-guru) |
| PUT | `/api/laporan-kerusakan/:id` | Update status, sesuaikan stok | Auth (non-guru) |
| DELETE | `/api/laporan-kerusakan/:id` | Hapus laporan, koreksi stok | Auth (non-guru) |

### Laporan Praktikum — `/api/laporan-praktikum`

| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/laporan-praktikum` | Ambil semua laporan | Auth |
| POST | `/api/laporan-praktikum` | Buat laporan praktikum | Auth |
| PUT | `/api/laporan-praktikum/:id` | Edit laporan | Auth (non-guru) |
| DELETE | `/api/laporan-praktikum/:id` | Hapus laporan | Auth (non-guru) |
| GET | `/api/laporan-praktikum/:id/pdf` | Generate & unduh PDF dari template DOCX | Auth |

### Pengajuan Jadwal — `/api/pengajuan`

| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/pengajuan` | Ambil semua pengajuan | Auth |
| POST | `/api/pengajuan` | Kirim pengajuan (multipart/form-data, opsional `file_pdf`) | Publik |
| PUT | `/api/pengajuan/:id` | Terima/tolak, masukkan ke jadwal | Auth (admin/laboran) |

> **Catatan:** `POST /api/pengajuan` menggunakan `upload.single('file_pdf')`. Jika tidak ada file, request tetap diproses. Field-file harus dikirim dengan `FormData`, bukan JSON.

### Peminjaman — `/api/peminjaman`

| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/peminjaman` | Ambil daftar peminjaman | Auth |
| POST | `/api/peminjaman` | Pinjam alat/sarana (multipart foto) | Auth |
| PUT | `/api/peminjaman/:id/kembali` | Kembalikan, lapor kerusakan, update stok | Auth (non-guru) |

### User — `/api/users`

| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/users` | Ambil semua user (tanpa password) | Auth (admin) |
| POST | `/api/users` | Tambah user baru | Auth (admin) |
| PUT | `/api/users/:id` | Edit user (opsional ganti password) | Auth (admin) |
| DELETE | `/api/users/:id` | Hapus user | Auth (admin) |

### Settings — `/api/settings`

| Method | Endpoint | Deskripsi | Akses |
|--------|----------|-----------|-------|
| GET | `/api/settings/public` | Pengaturan publik (nama sekolah, lab) | Publik |
| GET | `/api/settings` | Ambil semua pengaturan | Auth (admin) |
| PUT | `/api/settings` | Update pengaturan | Auth (admin) |
| POST | `/api/settings/template` | Upload template laporan praktikum (DOCX) | Auth (admin) |

### File Statis — `/uploads/`

| Path | Deskripsi | Akses |
|------|-----------|-------|
| `/uploads/pengajuan/<file>` | File PDF lampiran pengajuan | Publik (via Nginx) |
| `/uploads/templates/<file>` | Template DOCX laporan praktikum | Auth (internal) |

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
| `laporan_kerusakan` | Laporan kerusakan alat | `alat_id` → `alat.id` |
| `laporan_praktikum` | Laporan praktikum | `jadwal_id` → `jadwal.id`, `lab_id` → `lab.id` |
| `pengajuan_jadwal` | Pengajuan jadwal dari publik | `lab_id` → `lab.id` |
| `peminjaman` | Peminjaman alat/sarana | `alat_id` → `alat.id`, `sarana_id` → `sarana.id` |
| `settings` | Pengaturan web (key-value) | — |

### 5.3 Kolom Penting

- `alat` dan `sarana` memiliki kolom `spek` (VARCHAR 255).
- `bahan` memiliki `stok_awal` dan `stok_akhir` (DECIMAL 10,2), bukan `jumlah`.
- `jam_mulai` dan `jam_selesai` pada `jadwal`/`pengajuan_jadwal` adalah integer 1–10 (jam pelajaran).
- `pengajuan_jadwal` memiliki:
  - `processed_by` — mencatat nama admin yang memproses.
  - `processed_at` — waktu proses.
  - `file_pdf` (VARCHAR 255, NULL) — nama file PDF lampiran yang diupload pemohon. Boleh NULL, terutama jika pengajuan berasal dari chatbot (chatbot tidak mengirim file).
- Tabel `settings` menyimpan `nama_sekolah` dan `nama_lab` sebagai key-value.

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

> **Catatan penting:** Semua pemanggilan `apiGet`, `apiPost`, `apiPut`, `apiDelete` di frontend harus membaca properti `.data` dari respons:
>
> ```js
> const data = Array.isArray(response) ? response : (response.data || []);
> ```

### 6.2 Autentikasi & Otorisasi

- Token JWT dikirim via header `Authorization: Bearer <token>`.
- `verifyToken` memeriksa token, payload disimpan di `req.user`.
- `requireRole('admin', 'laboran', ...)` untuk membatasi akses.
- Role: `admin`, `laboran`, `guru`.

### 6.3 Penamaan

- Nama file modul: lowercase, tanda hubung jika perlu (`laporan-kerusakan`).
- Nama fungsi controller: `getAll`, `create`, `update`, `remove`.
- Variabel: camelCase.

### 6.4 Error Handling

Setiap controller wajib `try-catch`. Status yang dipakai:

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

Environment variables: `TOKEN_FONNTE`, `ADMIN_WA`.

> **Tips:** Pastikan `TOKEN_FONNTE` di `.env` identik dengan yang aktif di dashboard Fonnte. Jika notifikasi gagal dengan alasan `invalid token`, periksa apakah ada spasi/newline di `.env` atau perbedaan environment antar VPS.

### 6.6 Upload File

Middleware upload tersedia di:

| Middleware | Field | Folder tujuan |
|------------|-------|---------------|
| `uploadPeminjaman.js` | `upload.single('foto')` | `frontend/uploads/peminjaman` |
| `uploadPengajuan.js` | `upload.single('file_pdf')` | `backend/uploads/pengajuan/` |
| `uploadTemplate.js` | `upload.single('file')` | `backend/uploads/templates/laprak-template.docx` (overwrite) |

**Akses file publik:**

Semua file di `backend/uploads/` dapat diakses via URL:

```
https://lab.mugalearning.web.id/uploads/<folder>/<file>
```

Contoh: `https://lab.mugalearning.web.id/uploads/pengajuan/pengajuan-1234-5678.pdf`

Konfigurasi Nginx yang diperlukan (detail di [`installation.md`](./installation.md) §9):

```nginx
location /uploads/ {
    alias /var/www/lab/backend/uploads/;
    autoindex off;
    add_header Content-Disposition "inline";
}
```

---

## 7. Fitur Lampiran PDF pada Pengajuan Jadwal

Fitur ini memungkinkan guru/pemohon mengunggah proposal/kegiatan dalam format PDF saat mengajukan jadwal melalui halaman publik. Lampiran dapat dilihat oleh admin, laboran, dan guru dari dashboard.

### 7.1 Alur

1. **Guru** membuka halaman publik, klik sel kosong di tabel jadwal.
2. Modal pengajuan muncul, isi form, lalu pilih file PDF pada field **Lampiran Proposal (PDF)**.
3. Frontend mengirim data via `FormData` (bukan JSON) ke `POST /api/pengajuan`.
4. Backend memproses dengan middleware `uploadPengajuan` → file disimpan di `backend/uploads/pengajuan/`.
5. Nama file disimpan di kolom `file_pdf` tabel `pengajuan_jadwal`.
6. Notifikasi WA ke admin menyertakan tanda `📄 Lampiran PDF: Ya` jika ada file.
7. **Admin/Laboran/Guru** dapat membuka dashboard → menu **Pengajuan Jadwal** → kolom **Lampiran** menampilkan tombol **📄 PDF**.
8. Klik tombol tersebut → modal preview PDF muncul dengan `iframe` menampilkan file.

### 7.2 Ketentuan File

| Aspek | Nilai |
|-------|-------|
| Format | Hanya PDF (`application/pdf`) |
| Ukuran maksimal | 5 MB |
| Nama file | `pengajuan-<timestamp>-<random>.pdf` |
| Folder | `backend/uploads/pengajuan/` |
| Wajib | Tidak (opsional; chatbot tidak mengirim file) |
| Kolom DB | `pengajuan_jadwal.file_pdf` (VARCHAR 255, NULL) |

### 7.3 Frontend Publik — UI Upload

- Desain modern: area dashed dengan ikon PDF, efek hover, dan transisi halus.
- Mendukung **drag & drop**.
- Preview nama file + ukuran setelah dipilih.
- Tombol hapus (X) untuk reset pilihan.
- Validasi tipe dan ukuran sebelum dikirim.
- Fungsi global `resetUpload()` dipanggil saat modal ditutup/dibuka ulang.

**File terkait:**

| File | Bagian |
|------|--------|
| `frontend/index.html` | Markup upload area dalam modal `#modalPengajuan` |
| `frontend/css/style.css` | Class `.upload-area`, `.upload-preview`, `.upload-remove`, dll. |
| `frontend/js/main.js` | Handler upload, `FormData`, submit form |

### 7.4 Dashboard — Kolom Lampiran

- Kolom baru **Lampiran** ditampilkan di tabel pengajuan.
- Kolom **hanya muncul** untuk role `admin`, `laboran`, dan `guru`.
- Tombol **📄 PDF** hanya muncul jika `file_pdf` tidak NULL.
- Klik tombol → modal preview PDF (dibuat dinamis) dengan `iframe` yang memuat `/uploads/pengajuan/<filename>`.
- Untuk role `guru`, kolom **Aksi** tidak menampilkan tombol Terima/Tolak (hanya admin/laboran).

**File terkait:**

| File | Bagian |
|------|--------|
| `frontend/dashboard/assets/js/modules/pengajuan/pengajuan.js` | Render tabel, preview PDF, proses terima/tolak |
| `frontend/dashboard/style.css` | Class `.btn-pdf` |

### 7.5 Migrasi Database

Jika tabel `pengajuan_jadwal` belum memiliki kolom `file_pdf`:

```sql
ALTER TABLE pengajuan_jadwal
ADD COLUMN file_pdf VARCHAR(255) NULL AFTER kelas;
```

Tambahkan juga baris ini ke `backend/database/init.sql` agar konsisten.

### 7.6 Testing

```bash
# Uji upload via curl
curl -X POST http://localhost:7000/api/pengajuan \
  -F "pengaju=Test" \
  -F "nomor_wa=6281234567890" \
  -F "penanggung_jawab=Test PJ" \
  -F "kegiatan=Test" \
  -F "tanggal=2026-09-20" \
  -F "jam_mulai=1" \
  -F "jam_selesai=2" \
  -F "lab_id=1" \
  -F "file_pdf=@/path/ke/file.pdf"

# Cek file tersimpan
ls -la /var/www/lab/backend/uploads/pengajuan/

# Cek akses file dari URL
curl -I http://172.168.1.228/uploads/pengajuan/<namafile>.pdf
```

---

## 8. Fitur Template Laporan Praktikum (DOCX → PDF)

Fitur ini memungkinkan admin mengunggah template laporan praktikum dalam format DOCX, dan guru mengunduh laporan yang sudah terisi sebagai PDF.

### 8.1 Alur

1. **Admin** mengunggah file `.docx` melalui panel Pengaturan di dashboard.
2. File disimpan sebagai `backend/uploads/templates/laprak-template.docx`.
3. **Guru** mengklik tombol PDF pada laporan praktikum.
4. **Backend** (`laporan-praktikum.pdf.service.js`) melakukan:
   - Mengambil data laporan dari database.
   - Mengambil `nama_sekolah` dan `nama_lab` dari tabel `settings`.
   - Membaca template DOCX dengan `pizzip` dan `docxtemplater`.
   - Mengisi placeholder dengan data laporan.
   - Menyimpan file DOCX sementara di `backend/uploads/temp/`.
   - Mengonversi DOCX ke PDF menggunakan **LibreOffice headless**.
   - Mengirim PDF ke klien, lalu menghapus file sementara.

### 8.2 Placeholder Template DOCX

Template harus memuat placeholder berikut (persis, termasuk kurung kurawal ganda):

| Placeholder | Data |
|-------------|------|
| `{{NAMA_LAB}}` | Nama lab dari settings (untuk kop surat) |
| `{{NAMA_SEKOLAH}}` | Nama sekolah dari settings |
| `{{MATA_PELAJARAN}}` | Mata pelajaran |
| `{{JUDUL}}` | Judul praktikum |
| `{{KELAS}}` | Kelas |
| `{{JUMLAH_KELOMPOK}}` | Jumlah kelompok |
| `{{TANGGAL}}` | Tanggal praktikum (format Indonesia) |
| `{{TANGGAL_TTD}}` | Tanggal tanda tangan (bisa sama dengan `{{TANGGAL}}`) |
| `{{RUANG_LAB}}` | Nama ruang lab (berdasarkan `lab_id` laporan) |
| `{{JAM}}` | Jam mulai–selesai |
| `{{GURU}}` | Nama guru pengampu |
| `{{TUJUAN}}` | Tujuan praktikum |
| `{{ALAT}}` | Daftar alat (satu per baris) |
| `{{BAHAN}}` | Daftar bahan (satu per baris) |
| `{{DESKRIPSI}}` | Deskripsi kegiatan |

### 8.3 Dependensi

- **Node.js**: `docxtemplater`, `pizzip`, `multer` (lihat `package.json`).
- **Sistem**: **LibreOffice** (wajib diinstal manual di setiap VPS).

> Tanpa LibreOffice, endpoint `GET /api/laporan-praktikum/:id/pdf` akan gagal dengan error `libreoffice: not found`. Instalasi LibreOffice dibahas di [`installation.md`](./installation.md) §2.7.

---

## 9. Integrasi Chatbot

- Chatbot berjalan di `/opt/chatbot`, port 3000.
- Menerima webhook dari Fonnte, memproses pesan, dan merespons.
- Fitur:
  - Menu pengaduan/tiket (kategori, operator, tiket).
  - Handler `#jadwal` untuk pengajuan jadwal: parsing pesan → `POST /api/pengajuan` ke backend utama.
- Karena chatbot mengirim data dalam bentuk JSON (bukan `multipart/form-data`), pengajuan dari chatbot **tidak menyertakan lampiran PDF**. Kolom `file_pdf` akan berisi `NULL`.
- Database chatbot: `chatbot`, dengan tabel `operators`, `tickets`, `sessions`.

---

## 10. Menambah Modul Baru

Langkah-langkah:

1. Buat folder `backend/modules/nama-modul/`.
2. Isi tiga file: `nama-modul.routes.js`, `nama-modul.controller.js`, `nama-modul.service.js`.
3. Definisikan route, controller, service.
4. Tambahkan mounting di `app.js`:
   ```js
   app.use('/api/nama-modul', require('./modules/nama-modul/nama-modul.routes'));
   ```
5. **Jangan ubah** path atau method endpoint yang sudah ada.
6. Uji lokal sebelum push.

---

## 11. Contoh Modul `lab`

Lihat `backend/modules/lab/` sebagai template.

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

Untuk `lab.controller.js` dan `lab.service.js`, lihat langsung di folder `backend/modules/lab/`.

---

## 12. Alur Deployment (Ringkas)

1. **Di laptop:** tulis kode → commit → push ke GitHub.
2. **Di VPS:** masuk via SSH.
3. **Pull perubahan:**
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
   pm2 restart mugalab-backend
   ```
7. **Jika ada perubahan dependensi sistem** (LibreOffice, font, dsb.), lakukan instalasi manual di VPS.

> ⚠️ **Penting:** Jangan pernah mengedit langsung di VPS. Semua perubahan harus melalui GitHub agar konsisten dan terhindar dari konflik `git pull`.

> Detail lengkap ada di [`installation.md`](./installation.md) §15.

---

## 13. Checklist Penambahan Fitur Baru

Saat menambahkan fitur yang melibatkan upload file atau data baru, pastikan:

- [ ] Skema database diperbarui (tambah kolom/tabel).
- [ ] Migrasi SQL ditulis dan dijalankan di semua VPS.
- [ ] Middleware upload dibuat (jika perlu) dan disimpan di `shared/middleware/`.
- [ ] Route/controller/service disesuaikan.
- [ ] Folder upload dibuat dan diberikan izin (`chown adminlab:adminlab`, `chmod 775`).
- [ ] Konfigurasi Nginx ditambahkan (jika file harus diakses publik).
- [ ] Frontend diperbarui (UI + handler submit dengan `FormData`).
- [ ] Dashboard diperbarui (tampilan kolom baru + preview).
- [ ] Role-based access control diperiksa (siapa yang boleh lihat/ubah).
- [ ] Notifikasi WA disesuaikan (jika ada).
- [ ] Testing end-to-end (upload → simpan → tampil → unduh).
- [ ] Dokumentasi ini diperbarui.