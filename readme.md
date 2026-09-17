# MUGALAB

Aplikasi manajemen laboratorium sekolah berbasis web. Terdiri dari frontend publik, dashboard admin/laboran/guru, backend REST API, dan chatbot WhatsApp.

---

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Arsitektur](#-arsitektur)
- [Prasyarat](#-prasyarat)
- [Instalasi Backend](#-instalasi-backend)
- [Instalasi Frontend & Dashboard](#-instalasi-frontend--dashboard)
- [Instalasi Chatbot](#-instalasi-chatbot)
- [Konfigurasi Nginx](#-konfigurasi-nginx)
- [Menjalankan dengan PM2](#-menjalankan-dengan-pm2)
- [Konfigurasi Awal Aplikasi](#-konfigurasi-awal-aplikasi)
- [Deployment / Update Aplikasi](#-deployment--update-aplikasi)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Fitur Utama

- **Landing Page Publik** – jadwal mingguan interaktif dan pengajuan jadwal lab
- **Dashboard** – panel admin/laboran/guru untuk mengelola:
  - Jadwal kegiatan
  - Inventaris (alat, bahan, sarana)
  - Laporan kerusakan alat
  - Riwayat penggunaan bahan
  - Laporan kegiatan praktikum (unduh PDF)
  - Pengajuan jadwal
  - Peminjaman alat/sarana
  - Manajemen user
  - Pengaturan web (nama sekolah, nama lab, template laporan)
- **Chatbot WhatsApp** – pengaduan/tiket dan pengajuan jadwal via WhatsApp (Fonnte)

---

## 🏗 Arsitektur

```
[ Frontend Publik ]      [ Dashboard ]        [ Chatbot WhatsApp ]
        |                       |                        |
        +-----------------------+------------------------+
                                |
                        [ Backend API ]
                    (Express, port 7000)
                                |
                        [ MySQL Database ]
                (lab-db untuk backend, chatbot untuk chatbot)
```

- **Backend**: Node.js + Express + MySQL, arsitektur modular monolith
- **Frontend**: HTML, CSS, JavaScript (vanilla)
- **Chatbot**: Node.js + Express + MySQL (database terpisah)
- **Reverse Proxy**: Nginx
- **Process Manager**: PM2

---

## ✅ Prasyarat

Sebelum instalasi, pastikan sistem Anda memiliki:

- **Node.js** versi 18.x atau lebih baru ([download](https://nodejs.org))
- **NPM** (biasanya terinstal bersama Node.js)
- **MySQL** versi 8.x atau MariaDB 10.x
- **Nginx** (untuk reverse proxy)
- **PM2** (`npm install -g pm2`)
- **Git**
- **LibreOffice** (untuk konversi DOCX → PDF pada laporan praktikum)
- **Fonts** pendukung (Times New Roman atau Noto)

### Instalasi Prasyarat di Ubuntu/Debian

```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Node.js (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# MySQL
sudo apt install -y mysql-server

# Nginx
sudo apt install -y nginx

# PM2
sudo npm install -g pm2

# LibreOffice
sudo apt install -y libreoffice libreoffice-writer fonts-noto fonts-noto-cjk

# Git
sudo apt install -y git
```

---

## 🛠 Instalasi Backend

### 1. Clone Repositori

```bash
sudo mkdir -p /var/www/lab
sudo chown -R $USER:$USER /var/www/lab
cd /var/www/lab
git clone https://github.com/USERNAME/mugalab.git .
```

### 2. Setup Database

Masuk ke MySQL dan buat database:

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE `lab-db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'labuser'@'localhost' IDENTIFIED BY 'password_anda';
GRANT ALL PRIVILEGES ON `lab-db`.* TO 'labuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Import skema:

```bash
mysql -u labuser -p lab-db < /var/www/lab/backend/database/init.sql
```

### 3. Konfigurasi Environment

```bash
cd /var/www/lab/backend
cp .env.example .env
nano .env
```

Isi file `.env`:

```env
PORT=7000
NODE_ENV=production

DB_HOST=localhost
DB_USER=labuser
DB_PASSWORD=password_anda
DB_NAME=lab-db

JWT_SECRET=ganti_dengan_string_acak_panjang

TOKEN_FONNTE=token_fonnte_anda
ADMIN_WA=628123456789
```

**Tips:** Generate JWT_SECRET dengan `openssl rand -base64 32`.

### 4. Instal Dependensi

```bash
npm install
```

### 5. Buat Folder Upload

```bash
mkdir -p /var/www/lab/backend/uploads/templates
mkdir -p /var/www/lab/backend/uploads/temp
mkdir -p /var/www/lab/frontend/uploads/peminjaman
chmod -R 755 /var/www/lab/backend/uploads
chmod -R 755 /var/www/lab/frontend/uploads
```

### 6. Buat User Admin Pertama

Setelah server berjalan (lihat langkah PM2), buat user admin melalui endpoint `POST /api/users` dengan token yang diperoleh dari user default. Atau tambahkan langsung ke database:

```bash
# Generate hash bcrypt (jalankan di Node.js REPL)
node -e "console.log(require('bcryptjs').hashSync('admin123', 10))"
```

Lalu insert ke database:

```sql
INSERT INTO users (username, password, nama, role) VALUES
('admin', '$2a$10$HASIL_HASH_DI_ATAS', 'Administrator', 'admin');
```

---

## 🎨 Instalasi Frontend & Dashboard

Frontend dan dashboard adalah file statis yang disajikan oleh Nginx. Tidak ada proses build.

Pastikan folder `frontend/` dan `dashboard/` sudah ada di `/var/www/lab/`. Keduanya disajikan langsung lewat Nginx (lihat konfigurasi di bawah).

---

## 🤖 Instalasi Chatbot

Chatbot disimpan terpisah di `/opt/chatbot` karena memiliki database sendiri.

### 1. Pindahkan Folder Chatbot

```bash
sudo mkdir -p /opt/chatbot
sudo chown -R $USER:$USER /opt/chatbot
cp -r /var/www/lab/chatbot/* /opt/chatbot/
cd /opt/chatbot
```

### 2. Setup Database Chatbot

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE chatbot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'chatbotuser'@'localhost' IDENTIFIED BY 'password_chatbot';
GRANT ALL PRIVILEGES ON chatbot.* TO 'chatbotuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Buat tabel yang dibutuhkan chatbot (sesuaikan dengan skema Anda): `operators`, `tickets`, `sessions`.

### 3. Konfigurasi `.env` Chatbot

```bash
cd /opt/chatbot
cp .env.example .env
nano .env
```

```env
DATABASE_HOST=localhost
DATABASE_USER=chatbotuser
DATABASE_PASSWORD=password_chatbot
DATABASE_NAME=chatbot

FONNTE_TOKEN=token_fonnte_anda
```

### 4. Instal Dependensi & Jalankan

```bash
npm install
pm2 start index.js --name chatbot
```

---

## 🌐 Konfigurasi Nginx

Buat file konfigurasi Nginx:

```bash
sudo nano /etc/nginx/sites-available/mugalab
```

Isi dengan konfigurasi berikut (sesuaikan `server_name` dengan domain Anda):

```nginx
server {
    listen 80;
    server_name lab.example.com;

    # Frontend publik
    root /var/www/lab/frontend;
    index index.html;

    # Redirect /login ke folder login
    location /login {
        alias /var/www/lab/frontend/login;
        try_files $uri $uri/ /login/index.html;
    }

    # Redirect /dashboard ke folder dashboard
    location /dashboard {
        alias /var/www/lab/frontend/dashboard;
        try_files $uri $uri/ /dashboard/dashboard.html;
    }

    # Proxy ke Backend API
    location /api/ {
        proxy_pass http://localhost:7000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10M;
    }

    # Proxy ke Chatbot (webhook Fonnte)
    location /webhook {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Akses file upload dari frontend
    location /uploads/ {
        alias /var/www/lab/frontend/uploads/;
    }
}
```

Aktifkan konfigurasi dan restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/mugalab /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### (Opsional) HTTPS dengan Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d lab.example.com
```

---

## 🚀 Menjalankan dengan PM2

### Backend

```bash
cd /var/www/lab/backend
pm2 start server.js --name lab
```

### Chatbot

```bash
cd /opt/chatbot
pm2 start index.js --name chatbot
```

### Simpan Konfigurasi PM2

```bash
pm2 save
pm2 startup
# Ikuti perintah yang muncul untuk mengaktifkan autostart
```

### Perintah PM2 yang Berguna

```bash
pm2 list               # Lihat semua proses
pm2 logs lab           # Lihat log backend
pm2 logs chatbot       # Lihat log chatbot
pm2 restart lab        # Restart backend
pm2 restart chatbot    # Restart chatbot
pm2 flush lab          # Kosongkan log backend
```

---

## ⚙️ Konfigurasi Awal Aplikasi

Setelah server berjalan:

1. Buka `http://lab.example.com/login`
2. Login dengan user admin yang sudah dibuat (misal `admin` / `admin123`)
3. Masuk ke dashboard → menu **Pengaturan**:
   - Isi **Nama Sekolah** dan **Nama Lab**
   - Unggah **Template Laporan Praktikum** (file `.docx`) dengan placeholder:
     - `{{NAMA_LAB}}`, `{{NAMA_SEKOLAH}}`, `{{MATA_PELAJARAN}}`, `{{JUDUL}}`, `{{KELAS}}`, `{{JUMLAH_KELOMPOK}}`, `{{TANGGAL}}`, `{{TANGGAL_TTD}}`, `{{RUANG_LAB}}`, `{{JAM}}`, `{{GURU}}`, `{{TUJUAN}}`, `{{ALAT}}`, `{{BAHAN}}`, `{{DESKRIPSI}}`
4. Tambahkan user laboran dan guru melalui menu **Manajemen User**

---

## 🔄 Deployment / Update Aplikasi

Alur kerja yang direkomendasikan:

1. **Di laptop**: edit kode, commit, push ke GitHub
2. **Di VPS**: pull perubahan

```bash
cd /var/www/lab
git fetch --all
git reset --hard origin/main   # hati-hati: akan membuang perubahan lokal di VPS

# Jika ada dependensi baru
cd backend && npm install

# Restart
pm2 restart lab
```

Untuk chatbot:

```bash
cd /opt/chatbot
git pull   # jika chatbot juga di-track di repo terpisah
npm install
pm2 restart chatbot
```

### Alias Deploy (Opsional)

Tambahkan ke `~/.bashrc`:

```bash
alias deploy-lab='cd /var/www/lab && git fetch --all && git reset --hard origin/main && cd backend && npm install && pm2 restart lab'
alias deploy-chatbot='cd /opt/chatbot && git pull && npm install && pm2 restart chatbot'
```

Lalu `source ~/.bashrc`. Sekarang cukup ketik `deploy-lab` atau `deploy-chatbot`.

---

## 🔧 Troubleshooting

### Error 500 saat unduh PDF laporan praktikum

1. Cek LibreOffice sudah terinstal:
   ```bash
   which libreoffice
   libreoffice --version
   ```
2. Cek log PM2:
   ```bash
   pm2 logs lab --lines 50
   ```
3. Pastikan template DOCX sudah diunggah dan tidak memiliki placeholder yang terpecah.

### Error `EACCES: permission denied` saat upload

Beri izin tulis ke folder upload:

```bash
sudo chown -R $USER:$USER /var/www/lab/frontend/uploads
sudo chown -R $USER:$USER /var/www/lab/backend/uploads
chmod -R 755 /var/www/lab/frontend/uploads
chmod -R 755 /var/www/lab/backend/uploads
```

### Konflik `git pull` di VPS

Jika ada perubahan lokal di VPS yang tidak disengaja:

```bash
git fetch --all
git reset --hard origin/main
```

**Peringatan:** perintah ini akan membuang semua perubahan lokal di VPS.

### Chatbot tidak merespons

1. Cek proses berjalan: `pm2 list`
2. Cek log: `pm2 logs chatbot`
3. Pastikan webhook Fonnte diarahkan ke `https://lab.example.com/webhook`

---

## 📄 Lisensi

ISC

---

## 📚 Dokumentasi Lanjutan

Lihat `ARCHITECTURE.md` untuk dokumentasi lengkap tentang arsitektur backend, daftar endpoint API, konvensi kode, dan panduan menambah modul baru.