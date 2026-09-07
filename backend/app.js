const express = require('express');
const app = express();

// ================== GLOBAL MIDDLEWARE ==================
app.use(express.json());

// CORS (jika belum ada file-nya, bisa pakai middleware manual atau buat file baru)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// ================== HEALTH CHECK ==================
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Backend mugalab berjalan dengan baik!',
        timestamp: new Date().toISOString()
    });
});

// ================== MOUNT MODULES ==================
// Modul auth
app.use('/api/auth', require('./modules/auth/auth.routes'));

// Modul user
app.use('/api/users', require('./modules/user/user.routes'));

// Modul lab
app.use('/api/lab', require('./modules/lab/lab.routes'));

// Modul jadwal
app.use('/api/jadwal', require('./modules/jadwal/jadwal.routes'));

// Modul alat
app.use('/api/alat', require('./modules/alat/alat.routes'));

// Modul bahan
app.use('/api/bahan', require('./modules/bahan/bahan.routes'));

// Modul sarana
app.use('/api/sarana', require('./modules/sarana/sarana.routes'));

// Modul laporan kerusakan
app.use('/api/laporan-kerusakan', require('./modules/laporan-kerusakan/laporan-kerusakan.routes'));

// Modul laporan praktikum
app.use('/api/laporan-praktikum', require('./modules/laporan-praktikum/laporan-praktikum.routes'));

// Modul pengajuan
app.use('/api/pengajuan', require('./modules/pengajuan/pengajuan.routes'));

// Modul peminjaman
app.use('/api/peminjaman', require('./modules/peminjaman/peminjaman.routes'));

// Modul settings
app.use('/api/settings', require('./modules/settings/settings.routes'));

// 404 handler (tetap di bawah)
app.use((req, res) => {
    res.status(404).json({
        error: 'Route tidak ditemukan',
        path: req.originalUrl
    });
});

// ================== 404 HANDLER ==================
app.use((req, res) => {
    res.status(404).json({
        error: 'Route tidak ditemukan',
        path: req.originalUrl
    });
});

module.exports = app;