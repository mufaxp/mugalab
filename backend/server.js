require('dotenv').config();
const verifyToken = require('./shared/middleware/verifyToken');
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

    if (!username || !password) {
        return res.status(400).json({ message: 'Username dan password wajib diisi' });
    }

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Username anda salah' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Password anda salah' });
        }

        // buat jwt token
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                nama: user.nama 
            },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }  // Token berlaku 2 jam
        );

        // Kirim token + nama
        return res.status(200).json({
            message: 'Login berhasil',
            token: token,
            nama: user.nama
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});

// Route root
app.get('/', (req, res) => {
    res.send('Server mugalab aktif. Akses /api/health untuk cek kesehatan.');
});

// API Jadwal
app.get('/api/jadwal', verifyToken, async (req, res) => {
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

// tambah jadwal
app.post('/api/jadwal', verifyToken, async (req, res) => {
    const { penanggung_jawab, kegiatan, kelas, tanggal, jam_mulai, jam_selesai } = req.body;

    // Validasi
    if (!penanggung_jawab || !kegiatan || !tanggal || !jam_mulai || !jam_selesai) {
        return res.status(400).json({ message: 'Semua field wajib diisi' });
    }

    if (jam_selesai < jam_mulai) {
        return res.status(400).json({ message: 'Jam selesai harus lebih dari atau sama dengan jam mulai' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO jadwal (penanggung_jawab, kegiatan, kelas, tanggal, jam_mulai, jam_selesai) VALUES (?, ?, ?, ?, ?, ?)',
            [penanggung_jawab, kegiatan, kelas || '-', tanggal, jam_mulai, jam_selesai]
        );

        return res.status(201).json({
            message: 'Jadwal berhasil ditambahkan',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error menambahkan jadwal:', error);
        return res.status(500).json({ message: 'Gagal menambahkan jadwal' });
    }
});

// delete jadwal
app.delete('/api/jadwal/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query('DELETE FROM jadwal WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Jadwal tidak ditemukan' });
        }

        return res.status(200).json({ message: 'Jadwal berhasil dihapus' });
    } catch (error) {
        console.error('Error hapus jadwal:', error);
        return res.status(500).json({ message: 'Gagal menghapus jadwal' });
    }
});

// edit jadwal
app.put('/api/jadwal/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { penanggung_jawab, kegiatan, kelas, tanggal, jam_mulai, jam_selesai } = req.body;

    // Validasi
    if (!penanggung_jawab || !kegiatan || !tanggal || !jam_mulai || !jam_selesai) {
        return res.status(400).json({ message: 'Semua field wajib diisi' });
    }

    if (jam_selesai < jam_mulai) {
        return res.status(400).json({ message: 'Jam selesai harus >= jam mulai' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE jadwal SET penanggung_jawab = ?, kegiatan = ?, kelas = ?, tanggal = ?, jam_mulai = ?, jam_selesai = ? WHERE id = ?',
            [penanggung_jawab, kegiatan, kelas || '-', tanggal, jam_mulai, jam_selesai, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Jadwal tidak ditemukan' });
        }

        return res.status(200).json({ message: 'Jadwal berhasil diperbarui' });
    } catch (error) {
        console.error('Error memperbarui jadwal:', error);
        return res.status(500).json({ message: 'Gagal mengupdate jadwal' });
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