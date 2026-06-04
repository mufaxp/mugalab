require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('./config/db');

const app = express();

// Middleware
app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Backend mugalab berjalan dengan baik!',
        timestamp: new Date().toISOString()
    });
});

// Route login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    // validasi input
    if (!username || !password) {
        return res.status(400).json({ message: 'Username dan password wajib diisi'});
    }

    try {
        // Cari user di database
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Username atau password salah' });
        }

        const user = rows[0];
        // bandingkan password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json( {message: 'username atau password salah'} );
        }

        // login berhasil -> kirim nama
        return res.status(200).json({
            message: 'Login berhasil',
            nama: user.nama
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Terjadi kesalahan server'} );
    }
});

// Route root
app.get('/', (req, res) => {
    res.send('Server mugalab aktif. Akses /api/health untuk cek kesehatan.');
});

// API Jadwal
app.get('/api/jadwal', async (req, res) => {
    const { minggu_mulai } = req.query;

    if (!minggu_mulai) {
        return res.status(400).json({ message: 'Parameter minggu_mulai diperlukan' });
    }

    try {
        // Hitung akhir pekan (Ahad + 6 hari = Sabtu)
        const [rows] = await pool.query(
            `SELECT * FROM jadwal 
             WHERE tanggal >= ? AND tanggal <= DATE_ADD(?, INTERVAL 6 DAY)
             ORDER BY tanggal, jam_mulai`,
            [minggu_mulai, minggu_mulai]
        );
        return res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching jadwal:', error);
        return res.status(500).json({ message: 'Gagal mengambil data jadwal' });
    }
});

// 404 handler (harus diletakkan paling bawah)
app.use((req, res) => {
    res.status(404).json({ error: 'Route tidak ditemukan', path: req.originalUrl });
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
});