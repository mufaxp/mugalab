const pool = require('../../config/db');

/**
 * Ambil semua peminjaman dengan join alat/sarana
 * Filter: status, jenis, lab_id
 */
async function getAll({ status = null, jenis = null, lab_id = null }) {
    let query = `
        SELECT p.*,
            CASE WHEN p.jenis = 'alat' THEN a.kode_alat ELSE s.kode_sarana END as kode_item,
            CASE WHEN p.jenis = 'alat' THEN a.nama_alat ELSE s.nama_sarana END as nama_item
        FROM peminjaman p
        LEFT JOIN alat a ON p.jenis = 'alat' AND p.alat_id = a.id
        LEFT JOIN sarana s ON p.jenis = 'sarana' AND p.sarana_id = s.id
    `;

    const params = [];
    const conditions = [];

    if (status) {
        conditions.push('p.status = ?');
        params.push(status);
    }
    if (jenis) {
        conditions.push('p.jenis = ?');
        params.push(jenis);
    }
    if (lab_id) {
        conditions.push('(a.lab_id = ? OR s.lab_id = ?)');
        params.push(lab_id, lab_id);
    }

    if (conditions.length) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY p.created_at DESC';

    const [rows] = await pool.query(query, params);
    return rows;
}

/**
 * Ambil stok item (alat atau sarana)
 */
async function getStokItem(jenis, itemId) {
    const table = jenis === 'alat' ? 'alat' : 'sarana';
    const [rows] = await pool.query(`SELECT jumlah FROM ${table} WHERE id = ?`, [itemId]);
    return rows[0] || null;
}

/**
 * Kurangi stok item
 */
async function kurangiStok(jenis, itemId, jumlah) {
    const table = jenis === 'alat' ? 'alat' : 'sarana';
    await pool.query(`UPDATE ${table} SET jumlah = jumlah - ? WHERE id = ?`, [jumlah, itemId]);
}

/**
 * Kembalikan stok (jumlah kembali + jumlah rusak)
 */
async function kembalikanStok(jenis, itemId, jumlahKembali, jumlahRusak) {
    const table = jenis === 'alat' ? 'alat' : 'sarana';
    await pool.query(
        `UPDATE ${table} SET jumlah = jumlah + ?, jumlah_rusak = jumlah_rusak + ? WHERE id = ?`,
        [jumlahKembali, jumlahRusak, itemId]
    );
}

/**
 * Simpan peminjaman baru
 */
async function createPeminjaman(pemohon, jenis, alat_id, sarana_id, jumlah, kebutuhan, tanggal_pinjam, tanggal_kembali, foto_pinjam) {
    await pool.query(
        `INSERT INTO peminjaman (
            pemohon, jenis, alat_id, sarana_id, jumlah, kebutuhan,
            tanggal_pinjam, tanggal_kembali, foto_pinjam
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [pemohon, jenis, alat_id, sarana_id, jumlah, kebutuhan, tanggal_pinjam, tanggal_kembali, foto_pinjam]
    );
}

/**
 * Ambil peminjaman by ID
 */
async function getById(id) {
    const [rows] = await pool.query('SELECT * FROM peminjaman WHERE id = ?', [id]);
    return rows[0] || null;
}

/**
 * Update status pengembalian
 */
async function updateKembali(id, tanggalKembali, fotoKembali) {
    await pool.query(
        'UPDATE peminjaman SET status = ?, tanggal_kembali = ?, foto_kembali = ? WHERE id = ?',
        ['dikembalikan', tanggalKembali, fotoKembali, id]
    );
}

/**
 * Auto lapor kerusakan alat
 */
async function laporKerusakan(jenis, itemId, jumlahRusak, pelapor, tanggal, keterangan) {
    if (jenis !== 'alat') return; // Hanya alat yang punya laporan kerusakan

    await pool.query(
        'INSERT INTO laporan_kerusakan (alat_id, jumlah_rusak, pelapor, tanggal_lapor, keterangan) VALUES (?, ?, ?, ?, ?)',
        [itemId, jumlahRusak, pelapor, tanggal, keterangan]
    );
}

module.exports = {
    getAll,
    getStokItem,
    kurangiStok,
    kembalikanStok,
    createPeminjaman,
    getById,
    updateKembali,
    laporKerusakan
};