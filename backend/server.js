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
        let query = `SELECT j.*, 
            CASE WHEN lp.id IS NOT NULL THEN true ELSE false END as has_laporan
        FROM jadwal j 
        LEFT JOIN laporan_praktikum lp ON j.id = lp.jadwal_id
        WHERE j.tanggal >= ? AND j.tanggal <= DATE_ADD(?, INTERVAL 6 DAY)`;
        const params = [minggu_mulai, minggu_mulai];
        if (lab_id) {
            query += ' AND j.lab_id = ?';
            params.push(lab_id);
        }
        query += ' ORDER BY j.tanggal, j.jam_mulai';
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
        let query = `SELECT j.*, 
            CASE WHEN lp.id IS NOT NULL THEN true ELSE false END as has_laporan
        FROM jadwal j 
        LEFT JOIN laporan_praktikum lp ON j.id = lp.jadwal_id
        WHERE j.tanggal >= ? AND j.tanggal <= DATE_ADD(?, INTERVAL 6 DAY)`;
        const params = [minggu_mulai, minggu_mulai];

        if (lab_id) {
            query += ' AND j.lab_id = ?';
            params.push(lab_id);
        }

        query += ' ORDER BY j.tanggal, j.jam_mulai';

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

// GET semua laporan kerusakan
app.get('/api/laporan-kerusakan', verifyToken, async (req, res) => {
    const { lab_id } = req.query;
    try {
        let query = `
            SELECT lk.*, a.kode_alat, a.nama_alat 
            FROM laporan_kerusakan lk 
            JOIN alat a ON lk.alat_id = a.id
        `;
        const params = [];
        if (lab_id) {
            query += ' WHERE a.lab_id = ?';
            params.push(lab_id);
        }
        query += ' ORDER BY lk.created_at DESC';
        const [rows] = await pool.query(query, params);
        return res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching laporan:', error);
        return res.status(500).json({ message: 'Gagal mengambil data laporan' });
    }
});

// POST laporan baru
app.post('/api/laporan-kerusakan', verifyToken, async (req, res) => {
    const { alat_id, jumlah_rusak, pelapor, tanggal_lapor, keterangan } = req.body;

    if (!alat_id || !jumlah_rusak || !pelapor || !tanggal_lapor) {
        return res.status(400).json({ message: 'Field wajib diisi' });
    }

    try {
        // Cek stok alat
        const [alatRows] = await pool.query('SELECT jumlah FROM alat WHERE id=?', [alat_id]);
        if (alatRows.length === 0) return res.status(404).json({ message: 'Alat tidak ditemukan' });
        if (alatRows[0].jumlah < jumlah_rusak) {
            return res.status(400).json({ message: 'Jumlah alat tidak mencukupi' });
        }

        // Insert laporan
        await pool.query(
            'INSERT INTO laporan_kerusakan (alat_id, jumlah_rusak, pelapor, tanggal_lapor, keterangan) VALUES (?, ?, ?, ?, ?)',
            [alat_id, jumlah_rusak, pelapor, tanggal_lapor, keterangan || '']
        );

        // Kurangi stok alat
        await pool.query(
            'UPDATE alat SET jumlah = jumlah - ?, jumlah_rusak = jumlah_rusak + ? WHERE id = ?',
            [jumlah_rusak, jumlah_rusak, alat_id]
        );

        return res.status(201).json({ message: 'Laporan berhasil dibuat, stok alat berkurang' });
    } catch (error) {
        console.error('Error creating laporan:', error);
        return res.status(500).json({ message: 'Gagal membuat laporan' });
    }
});

// PUT update status laporan
app.put('/api/laporan-kerusakan/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ message: 'Status wajib diisi' });
    }

    try {
        // Ambil data laporan
        const [laporanRows] = await pool.query('SELECT * FROM laporan_kerusakan WHERE id=?', [id]);
        if (laporanRows.length === 0) return res.status(404).json({ message: 'Laporan tidak ditemukan' });

        const laporan = laporanRows[0];
        const oldStatus = laporan.status;

        // Update status
        await pool.query('UPDATE laporan_kerusakan SET status=? WHERE id=?', [status, id]);

        // Logika stok
        if (status === 'selesai' && (oldStatus === 'rusak' || oldStatus === 'diperbaiki')) {
            // Kembalikan stok
            await pool.query(
                'UPDATE alat SET jumlah = jumlah + ?, jumlah_rusak = jumlah_rusak - ? WHERE id = ?',
                [laporan.jumlah_rusak, laporan.jumlah_rusak, laporan.alat_id]
            );
        }
        // status 'dibuang' tidak mengubah stok

        return res.status(200).json({ message: 'Status berhasil diperbarui' });
    } catch (error) {
        console.error('Error updating laporan:', error);
        return res.status(500).json({ message: 'Gagal memperbarui status' });
    }
});

// DELETE laporan
app.delete('/api/laporan-kerusakan/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    try {
        const [laporanRows] = await pool.query('SELECT * FROM laporan_kerusakan WHERE id=?', [id]);
        if (laporanRows.length === 0) return res.status(404).json({ message: 'Laporan tidak ditemukan' });

        const laporan = laporanRows[0];

        // Jika status rusak atau diperbaiki, kembalikan stok (koreksi)
        if (laporan.status === 'rusak' || laporan.status === 'diperbaiki') {
            await pool.query(
                'UPDATE alat SET jumlah = jumlah + ?, jumlah_rusak = jumlah_rusak - ? WHERE id = ?',
                [laporan.jumlah_rusak, laporan.jumlah_rusak, laporan.alat_id]
            );
        }

        await pool.query('DELETE FROM laporan_kerusakan WHERE id=?', [id]);
        return res.status(200).json({ message: 'Laporan berhasil dihapus' });
    } catch (error) {
        console.error('Error deleting laporan:', error);
        return res.status(500).json({ message: 'Gagal menghapus laporan' });
    }
});

// DELETE riwayat penggunaan bahan
app.delete('/api/bahan/pakai/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM penggunaan_bahan WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Riwayat tidak ditemukan' });
        }
        return res.status(200).json({ message: 'Riwayat berhasil dihapus (stok tidak berubah)' });
    } catch (error) {
        console.error('Error deleting riwayat:', error);
        return res.status(500).json({ message: 'Gagal menghapus riwayat' });
    }
});

// Laporan Kegiatan Praktikum
// GET semua laporan
app.get('/api/laporan-praktikum', verifyToken, async (req, res) => {
    const { lab_id } = req.query;
    try {
        let query = 'SELECT * FROM laporan_praktikum';
        const params = [];
        if (lab_id) {
            query += ' WHERE lab_id = ?';
            params.push(lab_id);
        }
        query += ' ORDER BY tanggal DESC, created_at DESC';
        const [rows] = await pool.query(query, params);
        return res.status(200).json(rows);
    } catch (error) {
        return res.status(500).json({ message: 'Gagal mengambil laporan' });
    }
});

// POST buat laporan
app.post('/api/laporan-praktikum', verifyToken, async (req, res) => {
    const { jadwal_id, kelas, jumlah_kelompok, mata_pelajaran, jam_mulai, jam_selesai, guru_mapel, judul_praktikum, tujuan_praktikum, daftar_alat_bahan, deskripsi_kegiatan, tanggal, lab_id } = req.body;
    
    try {
        await pool.query(
            'INSERT INTO laporan_praktikum (jadwal_id, kelas, jumlah_kelompok, mata_pelajaran, jam_mulai, jam_selesai, guru_mapel, judul_praktikum, tujuan_praktikum, daftar_alat_bahan, deskripsi_kegiatan, tanggal, lab_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [jadwal_id || null, kelas, jumlah_kelompok, mata_pelajaran, jam_mulai, jam_selesai, guru_mapel, judul_praktikum, tujuan_praktikum, daftar_alat_bahan, deskripsi_kegiatan, tanggal, lab_id || 1]
        );
        return res.status(201).json({ message: 'Laporan berhasil dibuat' });
    } catch (error) {
        return res.status(500).json({ message: 'Gagal membuat laporan' });
    }
});

// PUT update laporan praktikum
app.put('/api/laporan-praktikum/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { kelas, jumlah_kelompok, mata_pelajaran, jam_mulai, jam_selesai, guru_mapel, judul_praktikum, tujuan_praktikum, daftar_alat_bahan, deskripsi_kegiatan, tanggal, lab_id } = req.body;
    
    try {
        await pool.query(
            'UPDATE laporan_praktikum SET kelas=?, jumlah_kelompok=?, mata_pelajaran=?, jam_mulai=?, jam_selesai=?, guru_mapel=?, judul_praktikum=?, tujuan_praktikum=?, daftar_alat_bahan=?, deskripsi_kegiatan=?, tanggal=?, lab_id=? WHERE id=?',
            [kelas, jumlah_kelompok, mata_pelajaran, jam_mulai, jam_selesai, guru_mapel, judul_praktikum, tujuan_praktikum, daftar_alat_bahan, deskripsi_kegiatan, tanggal, lab_id || 1, id]
        );
        return res.status(200).json({ message: 'Laporan berhasil diperbarui' });
    } catch (error) {
        return res.status(500).json({ message: 'Gagal memperbarui laporan' });
    }
});

// DELETE laporan
app.delete('/api/laporan-praktikum/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM laporan_praktikum WHERE id = ?', [id]);
        return res.status(200).json({ message: 'Laporan berhasil dihapus' });
    } catch (error) {
        return res.status(500).json({ message: 'Gagal menghapus laporan' });
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