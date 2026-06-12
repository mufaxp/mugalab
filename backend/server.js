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

// GET daftar lab
app.get('/api/lab', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM lab ORDER BY id');
        return res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching lab:', error);
        return res.status(500).json({ message: 'Gagal mengambil data lab' });
    }
});

// API Jadwal publik
app.get('/api/jadwal/public', async (req, res) => {
    const { minggu_mulai, lab_id } = req.query;

    if (!minggu_mulai) {
        return res.status(400).json({ message: 'Parameter minggu_mulai diperlukan' });
    }

    try {
        let query = `SELECT * FROM jadwal WHERE tanggal >= ? AND tanggal <= DATE_ADD(?, INTERVAL 6 DAY)`;
        const params = [minggu_mulai, minggu_mulai];

        if (lab_id) {
            query += ' AND lab_id = ?';
            params.push(lab_id);
        }

        query += ' ORDER BY tanggal, jam_mulai';

        const [rows] = await pool.query(query, params);
        return res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching jadwal:', error);
        return res.status(500).json({ message: 'Gagal mengambil data jadwal' });
    }
});

// api jadwal privat
app.get('/api/jadwal', verifyToken, async (req, res) => {
    const { minggu_mulai, lab_id } = req.query;

    if (!minggu_mulai) {
        return res.status(400).json({ message: 'Parameter minggu_mulai diperlukan' });
    }

    try {
        let query = `SELECT * FROM jadwal WHERE tanggal >= ? AND tanggal <= DATE_ADD(?, INTERVAL 6 DAY)`;
        const params = [minggu_mulai, minggu_mulai];

        if (lab_id) {
            query += ' AND lab_id = ?';
            params.push(lab_id);
        }

        query += ' ORDER BY tanggal, jam_mulai';

        const [rows] = await pool.query(query, params);
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
        const { lab_id } = req.body
        const [result] = await pool.query(
            'INSERT INTO jadwal (penanggung_jawab, kegiatan, kelas, tanggal, jam_mulai, jam_selesai, lab_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [penanggung_jawab, kegiatan, kelas || '-', tanggal, jam_mulai, jam_selesai, lab_id || 1]
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
        const { lab_id } = req.body;

        const [result] = await pool.query(
            'UPDATE jadwal SET penanggung_jawab = ?, kegiatan = ?, kelas = ?, tanggal = ?, jam_mulai = ?, jam_selesai = ?, lab_id = ? WHERE id = ?',
            [penanggung_jawab, kegiatan, kelas || '-', tanggal, jam_mulai, jam_selesai, lab_id || 1, id]
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

// GET semua alat di dashboard
app.get('/api/alat', verifyToken, async (req, res) => {
    const { lab_id } = req.query;
    try {
        let query = 'SELECT * FROM alat';
        const params = [];
        if (lab_id) {
            query += ' WHERE lab_id = ?';
            params.push(lab_id);
        }
        query += ' ORDER BY kode_alat';
        const [rows] = await pool.query(query, params);
        return res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching alat:', error);
        return res.status(500).json({ message: 'Gagal mengambil data alat' });
    }
});

// POST tambah alat
app.post('/api/alat', verifyToken, async (req, res) => {
    const { kode_alat, nama_alat, produsen, jumlah, lab_id, keterangan } = req.body;
    if (!kode_alat || !nama_alat || !jumlah) {
        return res.status(400).json({ message: 'Kode, nama, dan jumlah wajib diisi' });
    }
    try {
        const [result] = await pool.query(
            'INSERT INTO alat (kode_alat, nama_alat, produsen, jumlah, lab_id, keterangan) VALUES (?, ?, ?, ?, ?, ?)',
            [kode_alat, nama_alat, produsen || '-', jumlah, lab_id || 1, keterangan || '']
        );
        return res.status(201).json({ message: 'Data alat berhasil ditambahkan', id: result.insertId });
    } catch (error) {
        console.error('Error adding alat:', error);
        return res.status(500).json({ message: 'Gagal menambahkan data alat' });
    }
});

// PUT edit alat
app.put('/api/alat/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { kode_alat, nama_alat, produsen, jumlah, jumlah_rusak, kondisi, lab_id, keterangan } = req.body;
    try {
        const [result] = await pool.query(
            'UPDATE alat SET kode_alat=?, nama_alat=?, produsen=?, jumlah=?, jumlah_rusak=?, kondisi=?, lab_id=?, keterangan=? WHERE id=?',
            [kode_alat, nama_alat, produsen || '-', jumlah, jumlah_rusak || 0, kondisi || 'baik', lab_id || 1, keterangan || '', id]
        );
        return res.status(200).json({ message: 'Data alat berhasil diperbarui' });
    } catch (error) {
        console.error('Error updating alat:', error);
        return res.status(500).json({ message: 'Gagal memperbarui data alat' });
    }
});

// DELETE alat
app.delete('/api/alat/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM alat WHERE id=?', [id]);
        return res.status(200).json({ message: 'Data alat berhasil dihapus' });
    } catch (error) {
        console.error('Error menghapus alat:', error);
        return res.status(500).json({ message: 'Gagal menghapus data alat' });
    }
});

// GET semua bahan di dashboard
app.get('/api/bahan', verifyToken, async (req, res) => {
    const { lab_id } = req.query;
    try {
        let query = 'SELECT * FROM bahan';
        const params = [];
        if (lab_id) {
            query += ' WHERE lab_id = ?';
            params.push(lab_id);
        }
        query += ' ORDER BY kode_bahan';
        const [rows] = await pool.query(query, params);
        return res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching bahan:', error);
        return res.status(500).json({ message: 'Gagal mengambil data bahan' });
    }
});

// POST tambah bahan
app.post('/api/bahan', verifyToken, async (req, res) => {
    const { kode_bahan, nama_bahan, produsen, jumlah, satuan, tanggal_kadaluarsa, lab_id, keterangan } = req.body;
    if (!kode_bahan || !nama_bahan || !jumlah) {
        return res.status(400).json({ message: 'Kode, nama, dan jumlah wajib diisi' });
    }
    try {
        const [result] = await pool.query(
            'INSERT INTO bahan (kode_bahan, nama_bahan, produsen, jumlah, satuan, tanggal_kadaluarsa, lab_id, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [kode_bahan, nama_bahan, produsen || '-', jumlah, satuan, tanggal_kadaluarsa, lab_id || 1, keterangan || '']
        );
        return res.status(201).json({ message: 'Bahan berhasil ditambahkan', id: result.insertId });
    } catch (error) {
        console.error('Error adding bahan:', error);
        return res.status(500).json({ message: 'Gagal menambahkan bahan' });
    }
});

// PUT edit bahan
app.put('/api/bahan/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { kode_bahan, nama_bahan, produsen, jumlah, satuan, tanggal_kadaluarsa, lab_id, keterangan } = req.body;
    try {
        const [result] = await pool.query(
            'UPDATE bahan SET kode_bahan=?, nama_bahan=?, produsen=?, jumlah=?, satuan=?, tanggal_kadaluarsa=?, lab_id=?, keterangan=? WHERE id=?',
            [kode_bahan, nama_bahan, produsen || '-', jumlah, satuan, tanggal_kadaluarsa, lab_id || 1, keterangan || '', id]
        );
        return res.status(200).json({ message: 'Data bahan berhasil diperbarui' });
    } catch (error) {
        console.error('Error updating bahan:', error);
        return res.status(500).json({ message: 'Gagal memperbarui data bahan' });
    }
});

// DELETE bahan
app.delete('/api/bahan/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM bahan WHERE id=?', [id]);
        return res.status(200).json({ message: 'Data bahan berhasil dihapus' });
    } catch (error) {
        console.error('Error menghapus bahan:', error);
        return res.status(500).json({ message: 'Gagal menghapus data bahan' });
    }
});

// POST penggunaan bahan (kurangi stok)
app.post('/api/bahan/pakai', verifyToken, async (req, res) => {
    const { bahan_id, jumlah_digunakan, penanggung_jawab, kelas, kegiatan, tanggal } = req.body;

    if (!bahan_id || !jumlah_digunakan || !penanggung_jawab || !kegiatan || !tanggal) {
        return res.status(400).json({ message: 'Kolom wajib diisi' });
    }

    try {
        // cek stok
        const [bahanRows] = await pool.query('SELECT jumlah FROM bahan WHERE id=?', [bahan_id]);
        if (bahanRows.length === 0) return res.status(404).json({ message: 'Bahan tidak ditemukan' });

        if (bahanRows[0].jumlah < jumlah_digunakan) {
            return res.status(400).json({ message: 'Stok tidak mencukupi' });
        }

        // catat penggunaan
        await pool.query('INSERT INTO penggunaan_bahan (bahan_id, jumlah_digunakan, penanggung_jawab, kelas, kegiatan, tanggal) VALUES (?, ?, ?, ?, ?, ?)',
        [bahan_id, jumlah_digunakan, penanggung_jawab, kelas || '-', kegiatan, tanggal]
        );

        // kurangi stok
        await pool.query('UPDATE bahan SET jumlah = jumlah - ? WHERE id = ?', [jumlah_digunakan, bahan_id]);

        return res.status(200).json({ message: 'Data penggunaan berhasil dicatat, stok berkurang'})
    } catch (error) {
        console.error('Error penggunaan bahan:', error);
        return res.status(500).json({ message: 'Gagal mencatat penggunaan bahan' });
    }
});

// GET riwayat penggunaan bahan
app.get('/api/bahan/pakai', verifyToken, async (req, res) => {
    const { bahan_id } = req.query;
    try {
        let query = 'SELECT pb.*, b.nama_bahan, b.satuan FROM penggunaan_bahan pb JOIN bahan b ON pb.bahan_id = b.id';
        const params = [];
        if (bahan_id) {
            query += ' WHERE pb.bahan_id = ?';
            params.push(bahan_id);
        }
        query += ' ORDER BY pb.tanggal DESC, pb.created_at DESC LIMIT 100';
        const [rows] = await pool.query(query, params);
        return res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching penggunaan:', error);
        return res.status(500).json({ message: 'Gagal mengambil riwayat' });
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