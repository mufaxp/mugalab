# 🛠️ Panduan Instalasi MUGALAB

Panduan lengkap instalasi aplikasi MUGALAB dari nol di VPS Ubuntu 24.04 LTS.

> **Target pembaca:** Administrator server / developer yang akan mendeploy MUGALAB.
> **Estimasi waktu:** 30–45 menit (tergantung kecepatan internet & spesifikasi VPS).
> **Untuk gambaran arsitektur & konvensi kode, lihat [`architecture.md`](./architecture.md).**

---

## 📋 Daftar Isi

1. [Prasyarat](#1-prasyarat)
2. [Update Sistem & Instalasi Dependensi](#2-update-sistem--instalasi-dependensi)
3. [Setup MySQL](#3-setup-mysql)
4. [Pembuatan Folder & Hak Akses](#4-pembuatan-folder--hak-akses)
5. [Clone Repository](#5-clone-repository)
6. [Setup Backend](#6-setup-backend)
7. [Setup Chatbot](#7-setup-chatbot)
8. [Setup PM2](#8-setup-pm2)
9. [Konfigurasi Nginx](#9-konfigurasi-nginx)
10. [Setup HTTPS dengan Let's Encrypt (Opsional)](#10-setup-https-dengan-lets-encrypt-opsional)
11. [Setup Firewall UFW](#11-setup-firewall-ufw)
12. [Verifikasi Akhir](#12-verifikasi-akhir)
13. [Setup Webhook Fonnte](#13-setup-webhook-fonnte)
14. [Checklist Instalasi](#14-checklist-instalasi)
15. [Troubleshooting](#15-troubleshooting)
16. [Maintenance & Update](#16-maintenance--update)
17. [Catatan Khusus: WSL & Production](#17-catatan-khusus-wsl--production)

---

## 1. Prasyarat

### 1.1 Spesifikasi Minimum

| Komponen | Minimum | Rekomendasi |
|----------|---------|-------------|
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| RAM | 2 GB | 4 GB |
| Disk | 20 GB | 40 GB |
| CPU | 1 vCPU | 2 vCPU |
| Akses | SSH + sudo | SSH + sudo |

### 1.2 Yang Perlu Disiapkan

- [ ] VPS dengan Ubuntu 24.04 LTS
- [ ] Akses SSH (user non-root, misal `adminlab`, dengan `sudo`)
- [ ] Repositori GitHub (MUGALAB web + chatbot)
- [ ] Token Fonnte (dari [dashboard Fonnte](https://fonnte.com))
- [ ] Nomor WhatsApp admin (format: `6281234567890`)
- [ ] Domain (opsional, untuk HTTPS) — misal `lab.mugalearning.web.id`

### 1.3 Login ke VPS

```bash
ssh adminlab@<IP_VPS>
```

> **Catatan:** Semua perintah di panduan ini dijalankan sebagai user `adminlab` dengan `sudo`. Jika nama user Anda berbeda, sesuaikan.

---

## 2. Update Sistem & Instalasi Dependensi

### 2.1 Update Paket

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2 Instal Paket Dasar

```bash
sudo apt install -y \
  curl wget git build-essential nano unzip \
  ca-certificates software-properties-common
```

### 2.3 Instal Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 2.4 Instal MySQL

```bash
sudo apt install -y mysql-server
sudo systemctl enable mysql
sudo systemctl start mysql
```

### 2.5 Instal Node.js 20.x

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verifikasi:

```bash
node -v      # harus v20.x.x
npm -v       # harus 10.x.x
```

### 2.6 Instal PM2 (Global)

```bash
sudo npm install -g pm2
pm2 -v
```

### 2.7 Instal LibreOffice (untuk Generate PDF)

```bash
sudo apt install -y libreoffice libreoffice-writer fonts-noto fonts-noto-cjk
```

Verifikasi:

```bash
libreoffice --version
which libreoffice
```

> ⚠️ **Penting:** Tanpa LibreOffice, fitur download PDF laporan praktikum akan gagal dengan error `libreoffice: not found`.

### 2.8 Ringkasan Dependensi Sistem

| Paket | Fungsi | Digunakan oleh |
|-------|--------|----------------|
| Node.js 20.x | Runtime JavaScript | Backend & chatbot |
| npm | Package manager Node.js | Backend & chatbot |
| PM2 | Process manager (auto-restart) | Backend & chatbot |
| Nginx | Web server + reverse proxy | Semua aplikasi web |
| MySQL Server | Database | Backend & chatbot |
| LibreOffice | Konversi DOCX → PDF | Modul `laporan-praktikum` |
| libreoffice-writer | Writer untuk DOCX/PDF | Modul `laporan-praktikum` |
| fonts-noto | Font default (Latin, dll.) | Render PDF laporan |
| fonts-noto-cjk | Font CJK | (opsional) Render PDF |
| git | Clone & update repo | Deployment |
| ca-certificates | Verifikasi SSL (HTTPS ke Fonnte) | Notifikasi WA |
| curl / wget | Testing endpoint & unduh file | Debugging |

### 2.9 Verifikasi Semua Dependensi

```bash
node -v                       # v20.x.x
npm -v                        # 10.x.x
pm2 -v                        # 5.x.x
nginx -v                      # nginx/1.24.x
mysql --version               # Ver 8.x
libreoffice --version         # LibreOffice 24.x
git --version                 # git version 2.x
```

Semua perintah harus mengembalikan output (bukan `command not found`).

---

## 3. Setup MySQL

### 3.1 Amankan MySQL

```bash
sudo mysql_secure_installation
```

Rekomendasi jawaban:

| Pertanyaan | Jawaban |
|------------|---------|
| VALIDATE PASSWORD COMPONENT | `0` (Low) — untuk kemudahan |
| Set root password | **Ya** — catat passwordnya |
| Remove anonymous users | **Ya** |
| Disallow root login remotely | **Ya** |
| Remove test database | **Ya** |
| Reload privilege tables | **Ya** |

### 3.2 Jika Terjadi Error `1698 Access Denied`

Reset password root MySQL dengan metode `skip-grant-tables`:

```bash
# 1. Hentikan MySQL
sudo systemctl stop mysql
sudo pkill -f mysqld

# 2. Buat folder socket (kadang hilang)
sudo mkdir -p /var/run/mysqld
sudo chown mysql:mysql /var/run/mysqld

# 3. Tambahkan skip-grant-tables
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
# Tambahkan baris "skip-grant-tables" di bawah [mysqld]

# 4. Start MySQL
sudo systemctl start mysql

# 5. Login tanpa password
sudo mysql -u root
```

Di dalam MySQL:

```sql
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'PasswordBaruAnda';
FLUSH PRIVILEGES;
EXIT;
```

Lalu:

```bash
# 6. Hapus baris skip-grant-tables
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# 7. Restart
sudo systemctl restart mysql

# 8. Uji login
mysql -u root -p
```

### 3.3 Buat Database & User

```bash
sudo mysql -u root -p
```

```sql
-- Buat database
CREATE DATABASE `lab-db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE `chatbot` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Buat user khusus (lebih aman daripada root)
CREATE USER 'mugalab'@'localhost' IDENTIFIED BY 'PasswordMugalab';
GRANT ALL PRIVILEGES ON `lab-db`.* TO 'mugalab'@'localhost';
GRANT ALL PRIVILEGES ON `chatbot`.* TO 'mugalab'@'localhost';
FLUSH PRIVILEGES;

EXIT;
```

> **Catatan:** Ganti `PasswordMugalab` dengan password kuat. Password ini nanti dipakai di file `.env`.

---

## 4. Pembuatan Folder & Hak Akses

### 4.1 Folder Aplikasi Utama

```bash
sudo mkdir -p /var/www/lab
sudo chown -R adminlab:www-data /var/www/lab
sudo chmod -R 775 /var/www/lab
```

### 4.2 Folder Chatbot

```bash
sudo mkdir -p /opt/chatbot
sudo chown -R adminlab:adminlab /opt/chatbot
sudo chmod -R 755 /opt/chatbot
```

### 4.3 Folder Uploads Backend

```bash
sudo mkdir -p /var/www/lab/backend/uploads/pengajuan
sudo mkdir -p /var/www/lab/backend/uploads/templates
sudo mkdir -p /var/www/lab/backend/uploads/temp
sudo chown -R adminlab:www-data /var/www/lab/backend/uploads
sudo chmod -R 775 /var/www/lab/backend/uploads
```

**Fungsi tiap folder:**

| Folder | Fungsi |
|--------|--------|
| `pengajuan/` | Lampiran PDF dari pengajuan jadwal |
| `templates/` | Template DOCX laporan praktikum |
| `temp/` | File sementara saat konversi DOCX → PDF |

### 4.4 Folder Uploads Frontend

```bash
sudo mkdir -p /var/www/lab/frontend/uploads/peminjaman
sudo chown -R adminlab:www-data /var/www/lab/frontend/uploads
sudo chmod -R 775 /var/www/lab/frontend/uploads
```

**Fungsi:** menyimpan foto peminjaman dari dashboard.

### 4.5 Ringkasan Struktur Folder

```
/var/www/lab/                    ← user: adminlab, group: www-data
├── frontend/
│   └── uploads/peminjaman/      ← foto peminjaman
└── backend/
    └── uploads/
        ├── pengajuan/           ← lampiran PDF pengajuan
        ├── templates/           ← template DOCX laprak
        └── temp/                ← file sementara konversi

/opt/chatbot/                    ← user: adminlab
```

---

## 5. Clone Repository

### 5.1 Web Apps (Frontend + Dashboard + Backend)

```bash
cd /var/www/lab
git clone https://github.com/<username>/<repo-mugalab>.git .
```

> **Catatan:** Tanda titik (`.`) di akhir perintah berarti clone ke direktori saat ini (tidak membuat subfolder baru).

### 5.2 Chatbot

```bash
cd /opt/chatbot
git clone https://github.com/<username>/<repo-chatbot>.git .
```

### 5.3 Jika Repositori Privat

```bash
# Via HTTPS + PAT
git clone https://<username>:<token>@github.com/<username>/<repo>.git .

# Atau setup SSH key dulu
ssh-keygen -t ed25519 -C "vps@mugalab"
cat ~/.ssh/id_ed25519.pub
# Copy output ke GitHub → Settings → SSH Keys
git clone git@github.com:<username>/<repo>.git .
```

---

## 6. Setup Backend

### 6.1 Buat File `.env`

```bash
cd /var/www/lab/backend
cp .env.example .env
nano .env
```

Isi:

```env
PORT=7000
NODE_ENV=production
DB_HOST=localhost
DB_USER=mugalab
DB_PASSWORD=PasswordMugalab
DB_NAME=lab-db
JWT_SECRET=<string-acak-min-32-karakter>
TOKEN_FONNTE=<token-dari-dashboard-fonnte>
ADMIN_WA=6289688422795
```

**Cara generate `JWT_SECRET`:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

> ⚠️ **Jangan commit file `.env` ke GitHub!** Pastikan `.env` sudah ada di `.gitignore`.

### 6.2 Install Dependensi Node.js

```bash
cd /var/www/lab/backend
npm install
```

Atau jika ingin memastikan versi persis sesuai `package-lock.json`:

```bash
npm ci
```

### 6.3 Jalankan `init.sql`

```bash
# Cek dulu path init.sql
ls -la database/

# Import ke MySQL
mysql -u root -p lab-db < database/init.sql
```

### 6.4 Migrasi Tambahan (jika perlu)

Jika tabel `pengajuan_jadwal` belum memiliki kolom `file_pdf`:

```bash
mysql -u root -p lab-db -e "
ALTER TABLE pengajuan_jadwal
ADD COLUMN file_pdf VARCHAR(255) NULL AFTER kelas;
"
```

### 6.5 Buat User Admin Pertama

Generate hash password:

```bash
node -e "
const bcrypt = require('bcryptjs');
console.log(bcrypt.hashSync('Admin123!', 10));
"
```

Copy hash yang dihasilkan, lalu:

```bash
mysql -u root -p lab-db
```

```sql
INSERT INTO users (username, email, password_hash, role, nama, created_at)
VALUES (
  'admin',
  'admin@lab.com',
  '<hash-yang-di-generate>',
  'admin',
  'Administrator',
  NOW()
);
EXIT;
```

Login nanti dengan:

| Field | Nilai |
|-------|-------|
| Username | `admin` |
| Password | `Admin123!` |

> ⚠️ **Segera ganti password** setelah login pertama.

### 6.6 Uji Coba Backend

Jalankan sementara (untuk testing):

```bash
node server.js
```

Jika sukses, akan muncul:

```
🚀 Server berjalan di http://localhost:7000
🔍 Health check: http://localhost:7000/api/health
```

Uji di terminal lain:

```bash
curl http://localhost:7000/api/health
```

Output:

```json
{"status":"OK","message":"Backend mugalab berjalan dengan baik!","timestamp":"..."}
```

Hentikan dengan **Ctrl+C** (karena nanti akan dijalankan via PM2).

---

## 7. Setup Chatbot

### 7.1 Buat File `.env`

```bash
cd /opt/chatbot
cp .env.example .env
nano .env
```

Isi:

```env
PORT=3000
NODE_ENV=production
DB_HOST=localhost
DB_USER=mugalab
DB_PASSWORD=PasswordMugalab
DB_NAME=chatbot
TOKEN_FONNTE=<token-yang-sama-dengan-backend>
```

### 7.2 Install Dependensi

```bash
npm install
```

### 7.3 Import Skema Database Chatbot

Jika ada file `init.sql` di chatbot:

```bash
mysql -u root -p chatbot < database/init.sql
```

### 7.4 Uji Coba Chatbot

```bash
node index.js
```

Jika sukses, akan muncul log seperti:

```
Chatbot berjalan di port 3000
```

Uji webhook:

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"sender":"6281234567890","message":"test","name":"Test"}'
```

Harus mengembalikan respons (biasanya `OK` atau JSON).

Hentikan dengan **Ctrl+C**.

---

## 8. Setup PM2

### 8.1 Jalankan Backend

```bash
cd /var/www/lab/backend
pm2 start server.js --name mugalab-backend
```

### 8.2 Jalankan Chatbot

```bash
cd /opt/chatbot
pm2 start server.js --name chatbot
# atau: pm2 start index.js --name chatbot
```

### 8.3 Simpan Konfigurasi PM2

```bash
pm2 save
```

### 8.4 Setup Auto-Start saat Boot

```bash
pm2 startup
```

Perintah ini akan menampilkan output seperti:

```
[PM2] To setup the Startup Script, copy/paste the following command:
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u adminlab --hp /home/adminlab
```

Copy dan jalankan perintah tersebut (yang dimulai dengan `sudo env PATH=...`).

### 8.5 Verifikasi

```bash
pm2 status
```

Output yang diharapkan:

```
┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┐
│ id │ name               │ mode     │ ↺    │ status    │ cpu      │
├────┼────────────────────┼──────────┼──────┼───────────┼──────────┤
│ 0  │ mugalab-backend    │ fork     │ 0    │ online    │ 0%       │
│ 1  │ chatbot            │ fork     │ 0    │ online    │ 0%       │
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┘
```

### 8.6 Perintah PM2 Harian

```bash
pm2 status                      # cek status
pm2 logs mugalab-backend        # log backend
pm2 logs chatbot                # log chatbot
pm2 restart mugalab-backend     # restart backend
pm2 restart all                 # restart semua
pm2 monit                       # monitor real-time
pm2 delete <name>               # hapus proses
```

---

## 9. Konfigurasi Nginx

### 9.1 Buat File Konfigurasi

```bash
sudo nano /etc/nginx/sites-available/lab
```

Isi:

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name lab.mugalearning.web.id 172.168.1.228 _;

    root /var/www/lab/frontend;
    index index.html;

    # ============================================
    # HALAMAN LOGIN
    # ============================================
    location = /login {
        try_files /login/login.html =404;
    }
    location /login/ {
        try_files $uri /login/login.html;
    }

    # ============================================
    # HALAMAN DASHBOARD (SPA)
    # ============================================
    location = /dashboard {
        try_files /dashboard/dashboard.html =404;
    }
    location /dashboard/ {
        try_files $uri $uri/ /dashboard/dashboard.html;
    }

    # ============================================
    # AKSES FILE UPLOAD (PDF pengajuan, foto peminjaman, dll.)
    # ⚠️ WAJIB ada SEBELUM location /
    # ============================================
    location /uploads/ {
        alias /var/www/lab/backend/uploads/;
        autoindex off;
        add_header Content-Disposition "inline";
        add_header X-Content-Type-Options "nosniff";
    }

    # ============================================
    # PROXY API KE BACKEND (port 7000)
    # ============================================
    location /api/ {
        proxy_pass http://127.0.0.1:7000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeout untuk request berat (upload PDF, generate PDF laporan)
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        client_max_body_size 10M;
    }

    # ============================================
    # PROXY CHATBOT WHATSAPP (port 3000)
    # ============================================
    location /chatbot/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }

    # ============================================
    # FALLBACK SPA (HARUS PALING BAWAH)
    # ============================================
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 9.2 Aktifkan Konfigurasi

```bash
# Buat symlink
sudo ln -s /etc/nginx/sites-available/lab /etc/nginx/sites-enabled/

# Hapus default (jika ada)
sudo unlink /etc/nginx/sites-enabled/default

# Uji konfigurasi
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

Output yang diharapkan saat `nginx -t`:

```
nginx: configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 9.3 ⚠️ Urutan `location` yang Benar

Nginx memilih `location` berdasarkan **prioritas**. Untuk kasus `/uploads/` vs `/`, urutan tetap penting agar tidak jatuh ke fallback SPA.

**Urutan yang benar:**

```
1. location = /login            (exact match)
2. location /login/             (prefix)
3. location = /dashboard        (exact match)
4. location /dashboard/         (prefix)
5. location /uploads/           (prefix — file statis dari backend)
6. location /api/               (prefix — proxy)
7. location /chatbot/           (prefix — proxy)
8. location /                   (fallback SPA)
```

**Kesalahan yang sering terjadi:** `location /uploads/` diletakkan **setelah** `location /`. Akibatnya, request ke `/uploads/pengajuan/xxx.pdf` akan jatuh ke fallback dan menampilkan `index.html`.

### 9.4 Perbedaan `root` vs `alias` (Penting!)

**`root`** — menambahkan path ke URL:

```nginx
location /uploads/ {
    root /var/www/lab/backend;
}
# URL /uploads/file.pdf → /var/www/lab/backend/uploads/file.pdf
```

**`alias`** — mengganti path di URL:

```nginx
location /uploads/ {
    alias /var/www/lab/backend/uploads/;
}
# URL /uploads/file.pdf → /var/www/lab/backend/uploads/file.pdf
```

Untuk MUGALAB, **gunakan `alias`** karena kita ingin URL `/uploads/...` dipetakan langsung ke folder `backend/uploads/`.

### 9.5 Verifikasi

```bash
# Cek Nginx mendengarkan di port 80
sudo ss -tulpn | grep :80

# Cek semua server block aktif
sudo nginx -T | grep -E "listen|server_name|location|root|alias"

# Cek urutan location
sudo nginx -T | grep "location"
```

---

## 10. Setup HTTPS dengan Let's Encrypt (Opsional)

Hanya diperlukan jika aplikasi diakses dari **internet publik**.

### 10.1 Instal Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 10.2 Generate Sertifikat

```bash
sudo certbot --nginx -d lab.mugalearning.web.id
```

Ikuti instruksi di layar:

1. Masukkan email
2. Setuju TOS
3. Pilih redirect HTTP → HTTPS: **Ya**

### 10.3 Verifikasi Auto-Renewal

```bash
sudo certbot renew --dry-run
```

Certbot otomatis memperbarui sertifikat setiap 90 hari via systemd timer.

### 10.4 Konfigurasi Nginx Setelah HTTPS

Setelah Certbot dijalankan, `/etc/nginx/sites-available/lab` akan otomatis diperbarui menjadi:

```nginx
server {
    listen 80 default_server;
    server_name lab.mugalearning.web.id;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name lab.mugalearning.web.id;

    ssl_certificate /etc/letsencrypt/live/lab.mugalearning.web.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lab.mugalearning.web.id/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # ... sisanya sama seperti konfigurasi HTTP
}
```

---

## 11. Setup Firewall UFW

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Verifikasi
sudo ufw status
```

Output yang diharapkan:

```
Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere
Nginx Full                 ALLOW       Anywhere
```

> ⚠️ **Jangan lupa allow OpenSSH sebelum enable**, agar koneksi SSH tidak terputus.

---

## 12. Verifikasi Akhir

### 12.1 Cek Semua Layanan

```bash
pm2 status                       # semua "online"
sudo systemctl status nginx      # active (running)
sudo systemctl status mysql      # active (running)
```

### 12.2 Cek Endpoint via Curl

```bash
# Backend langsung
curl http://localhost:7000/api/health

# Lewat Nginx
curl http://172.168.1.228/api/health

# Chatbot webhook
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"sender":"6281234567890","message":"test"}'

# File upload (jika ada)
curl -I http://172.168.1.228/uploads/pengajuan/<file>.pdf
```

### 12.3 Cek via Browser

| URL | Fungsi |
|-----|--------|
| `http://172.168.1.228/` | Halaman publik (jadwal) |
| `http://172.168.1.228/login` | Halaman login dashboard |
| `http://172.168.1.228/dashboard` | Dashboard (setelah login) |
| `http://172.168.1.228/api/health` | Health check API |

### 12.4 Uji Fitur Utama

- [ ] Login dengan `admin` / `Admin123!`
- [ ] Tambah lab, alat, bahan, sarana
- [ ] Tambah jadwal → cek notifikasi WA
- [ ] Ajukan jadwal dari halaman publik (dengan upload PDF)
- [ ] Terima pengajuan dari dashboard
- [ ] Preview lampiran PDF
- [ ] Buat laporan praktikum → download PDF
- [ ] Peminjaman alat dengan foto
- [ ] Chatbot: kirim pesan WA, cek balasan otomatis

---

## 13. Setup Webhook Fonnte

### 13.1 Login ke Dashboard Fonnte

Buka [https://fonnte.com](https://fonnte.com) dan login.

### 13.2 Daftarkan Device (Nomor WhatsApp)

- Tambahkan nomor WA yang akan dipakai
- Scan QR code dari HP
- Pastikan status device: **Connected**

### 13.3 Setup Webhook

- Masuk ke menu **Device** → **Webhook**
- Isi URL: `https://lab.mugalearning.web.id/chatbot/webhook`
- Method: `POST`
- Event: centang `message` (dan opsi lain sesuai kebutuhan)
- Simpan

### 13.4 Uji Webhook

Kirim pesan WhatsApp ke nomor device, contoh:

```
halo
```

Chatbot harus membalas dengan menu utama.

Jika tidak ada balasan:

- Cek log chatbot: `pm2 logs chatbot --lines 30`
- Cek log Nginx: `sudo tail -f /var/log/nginx/access.log`
- Pastikan URL webhook bisa diakses dari internet (gunakan HTTPS)

---

## 14. Checklist Instalasi

### 14.1 Sistem & Dependensi

- [ ] Ubuntu 24.04 LTS terinstal
- [ ] User non-root dengan `sudo` sudah dibuat
- [ ] Paket dasar (git, curl, wget, build-essential) terinstal
- [ ] Node.js 20.x terinstal
- [ ] npm tersedia
- [ ] PM2 terinstal global
- [ ] Nginx terinstal & berjalan
- [ ] MySQL server terinstal & berjalan
- [ ] LibreOffice terinstal (`libreoffice --version` berjalan)
- [ ] Font Noto terinstal

### 14.2 Database

- [ ] MySQL diamankan (`mysql_secure_installation`)
- [ ] Database `lab-db` dibuat
- [ ] Database `chatbot` dibuat
- [ ] User `mugalab` dengan password kuat dibuat
- [ ] Tabel dari `init.sql` di-import
- [ ] Migrasi tambahan dijalankan (kolom `file_pdf`)
- [ ] User admin pertama dibuat

### 14.3 Folder & Hak Akses

- [ ] `/var/www/lab` dibuat dengan owner `adminlab:www-data`
- [ ] `/opt/chatbot` dibuat
- [ ] `/var/www/lab/backend/uploads/{pengajuan,templates,temp}` dibuat
- [ ] `/var/www/lab/frontend/uploads/peminjaman` dibuat
- [ ] Semua folder punya permission `775`

### 14.4 Aplikasi

- [ ] Repo web di-clone ke `/var/www/lab`
- [ ] Repo chatbot di-clone ke `/opt/chatbot`
- [ ] `.env` backend dibuat & dikonfigurasi
- [ ] `.env` chatbot dibuat & dikonfigurasi
- [ ] `npm install` di backend & chatbot berhasil
- [ ] `pm2 start` untuk backend & chatbot
- [ ] `pm2 save` & `pm2 startup` sudah dijalankan

### 14.5 Nginx

- [ ] File `/etc/nginx/sites-available/lab` dibuat
- [ ] Symlink ke `sites-enabled/` sudah ada
- [ ] `default` dinonaktifkan
- [ ] `nginx -t` sukses
- [ ] Nginx di-reload
- [ ] `location /uploads/` ada & di atas `location /`

### 14.6 Opsional

- [ ] HTTPS via Certbot
- [ ] Firewall UFW aktif
- [ ] Webhook Fonnte terdaftar
- [ ] Backup otomatis (cron)

---

## 15. Troubleshooting

### 15.1 Masalah Umum

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| `403 Forbidden` di root Nginx | Kepemilikan file salah | `sudo chown -R adminlab:www-data /var/www/lab` |
| `404 Not Found` di `/api/...` | Blok `location /api/` tidak ada | Cek konfigurasi Nginx, reload |
| `502 Bad Gateway` | Backend tidak berjalan | `pm2 status`, `pm2 restart` |
| `EACCES: permission denied` | Folder upload tidak ada | Buat folder + `chown` |
| `libreoffice: not found` | LibreOffice belum terinstal | `sudo apt install -y libreoffice libreoffice-writer` |
| `invalid token` di WA | Token Fonnte salah / ada spasi di `.env` | Cek `.env`, restart PM2 |
| MySQL error `1698` | Root pakai `auth_socket` | Reset via `skip-grant-tables` (§3.2) |
| Iframe PDF menampilkan halaman jadwal | Fallback SPA menangkap `/uploads/` | Pindah `location /uploads/` ke atas `location /` |
| `alias` tidak diakhiri `/` | Path jadi salah | Pastikan `alias .../uploads/;` |
| Folder upload tidak bisa dibaca | Permission salah | `chown adminlab:www-data` + `chmod 755` |
| Chatbot `Cannot GET /webhook` | Diakses dengan GET, harus POST | Gunakan `curl -X POST` |
| Webhook Fonnte tidak merespon | URL salah / route tidak ada | Cek log PM2 chatbot + `curl -X POST` di server |
| Template DOCX tidak terdeteksi | Placeholder salah atau file corrupt | Pastikan `{{NAMA_LAB}}` (kurung ganda) |

### 15.2 Cara Cek Log

```bash
# Backend
pm2 logs mugalab-backend --lines 50
pm2 logs mugalab-backend --lines 50 --err

# Chatbot
pm2 logs chatbot --lines 50

# Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# MySQL
sudo tail -f /var/log/mysql/error.log

# System
journalctl -u nginx -n 50
journalctl -u mysql -n 50
```

### 15.3 Reset Cepat

```bash
pm2 restart all
sudo systemctl restart nginx
sudo systemctl restart mysql
```

### 15.4 Cek Port yang Digunakan

```bash
sudo ss -tulpn | grep -E ":80|:443|:3000|:7000|:3306"
```

---

## 16. Maintenance & Update

### 16.1 Update Aplikasi dari GitHub

```bash
# 1. Backup dulu (opsional tapi direkomendasikan)
mysqldump -u root -p lab-db > /backup/lab-db_$(date +%Y%m%d).sql

# 2. Pull perubahan
cd /var/www/lab
git fetch --all
git reset --hard origin/main

# 3. Update backend
cd /var/www/lab/backend
npm install   # hanya jika package.json berubah
pm2 restart mugalab-backend

# 4. Update chatbot
cd /opt/chatbot
git fetch --all
git reset --hard origin/main
npm install   # hanya jika package.json berubah
pm2 restart chatbot
```

### 16.2 Backup Database Rutin

Buat script backup:

```bash
sudo nano /usr/local/bin/backup-mugalab.sh
```

Isi:

```bash
#!/bin/bash
BACKUP_DIR="/backup/mugalab"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u root -p'PasswordRootAnda' lab-db | gzip > $BACKUP_DIR/lab-db_$DATE.sql.gz
mysqldump -u root -p'PasswordRootAnda' chatbot | gzip > $BACKUP_DIR/chatbot_$DATE.sql.gz

# Hapus backup > 30 hari
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup selesai: $DATE"
```

Beri izin eksekusi:

```bash
sudo chmod +x /usr/local/bin/backup-mugalab.sh
```

Tambahkan ke cron (backup tiap hari jam 2 pagi):

```bash
sudo crontab -e
```

Tambahkan:

```
0 2 * * * /usr/local/bin/backup-mugalab.sh >> /var/log/backup-mugalab.log 2>&1
```

### 16.3 Monitoring

```bash
# Cek resource
df -h                       # disk
free -h                     # memory
top                         # proses
htop                        # (install dulu: sudo apt install htop)

# Monitoring PM2
pm2 monit
pm2 status

# Monitoring Nginx
sudo tail -f /var/log/nginx/access.log
```

### 16.4 Perintah Maintenance Harian

```bash
# Restart semua
pm2 restart all

# Cek log error
pm2 logs --err --lines 20

# Bersihkan log PM2
pm2 flush

# Cek versi Node.js
node -v

# Cek update sistem
sudo apt update && sudo apt list --upgradable
```

---

## 17. Catatan Khusus: WSL & Production

### 17.1 WSL (Windows Subsystem for Linux)

Jika deployment dilakukan di WSL:

1. **Project di `/mnt/c/...`** (Windows filesystem) → akses lambat + kadang permission error. Sebaiknya pindah ke `~/mugalab` (filesystem Linux native).
2. **LibreOffice** tetap bisa diinstal via `apt` dan berjalan di WSL.
3. **Path output** sebaiknya diarahkan ke filesystem Linux (bukan `/mnt/c/`) untuk menghindari masalah lock file.
4. **Firewall Windows** mungkin memblokir port 80/443. Jika tidak bisa diakses dari Windows:
   - Buka **Windows Defender Firewall** → **Advanced Settings** → **Inbound Rules** → **New Rule**
   - Pilih **Port** → **TCP** → **80, 443**
   - Allow connection → Apply
   - Atau akses langsung dari dalam WSL: `curl http://localhost`

### 17.2 Catatan Production

Untuk production di VPS dengan trafik tinggi:

- **LibreOffice headless** memakan RAM ~100–200 MB per proses. Jika banyak request PDF bersamaan, bisa membebani VPS kecil (1 GB RAM).
- Alternatif jika resource terbatas:
  - **Gotenberg** — service Docker untuk konversi DOCX → PDF
  - **unoconv** — wrapper LibreOffice sebagai service (install via `pip`)
  - **Cache PDF** hasil generate agar tidak perlu konversi berulang

---

## 📞 Bantuan Lanjutan

Jika mengalami kendala yang tidak tercakup di dokumen ini:

1. Cek dokumentasi arsitektur: [`architecture.md`](./architecture.md)
2. Cek log sesuai bagian [§15.2](#152-cara-cek-log)
3. Cari error di Google dengan kata kunci pesan error + "ubuntu 24.04"
4. Hubungi tim developer MUGALAB

---

**Selamat! Aplikasi MUGALAB siap digunakan.** 🎉

Pastikan semua checklist di [§14](#14-checklist-instalasi) sudah tercentang sebelum dinyatakan selesai.