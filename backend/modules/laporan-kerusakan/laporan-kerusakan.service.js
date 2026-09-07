const pool = require('../../config/db');

/**
 * Ambil semua laporan kerusakan (join alat)
 * dengan filter lab_id opsional
 */
async function getAll(labId = null) {
    let query = `
        SELECT lk.*, a.kode_alat, a.nama_alat 
        FROM laporan_kerusakan lk 
        JOIN alat a ON lk.alat_id = a.id
    `;
    const params = [];

    if (labId) {
        query += ' WHERE a.lab_id = ?';
        params.push(labId);
    }

    query += ' ORDER BY lk.created_at DESC';
    const [rows] = await pool.query(query, params);
    return rows;
}

/**
 * Ambil stok alat berdasarkan id
 */
async function getAlatStok(alatId) {
    const [rows] = await pool.query('SELECT jumlah FROM alat WHERE id=?', [alatId]);
    return rows[0] || null;
}

/**
 * Tambah laporan kerusakan
 */
async function create(alat_id, jumlah_rusak, pelapor, tanggal_lapor, keterangan) {
    await pool.query(
        'INSERT INTO laporan_kerusakan (alat_id, jumlah_rusak, pelapor, tanggal_lapor, keterangan) VALUES (?, ?, ?, ?, ?)',
        [alat_id, jumlah_rusak, pelapor, tanggal_lapor, keterangan]
    );
}

/**
 * Kurangi stok alat & tambah jumlah_rusak
 */
async function kurangiStokAlat(alatId, jumlahRusak) {
    await pool.query(
        'UPDATE alat SET jumlah = jumlah - ?, jumlah_rusak = jumlah_rusak + ? WHERE id = ?',
        [jumlahRusak, jumlahRusak, alatId]
    );
}

/**
 * Kembalikan stok alat & kurangi jumlah_rusak
 */
async function kembalikanStokAlat(alatId, jumlahRusak) {
    await pool.query(
        'UPDATE alat SET jumlah = jumlah + ?, jumlah_rusak = jumlah_rusak - ? WHERE id = ?',
        [jumlahRusak, jumlahRusak, alatId]
    );
}

/**
 * Ambil laporan by ID
 */
async function getById(id) {
    const [rows] = await pool.query('SELECT * FROM laporan_kerusakan WHERE id=?', [id]);
    return rows[0] || null;
}

/**
 * Update status laporan
 */
async function updateStatus(id, status) {
    await pool.query('UPDATE laporan_kerusakan SET status=? WHERE id=?', [status, id]);
}

/**
 * Hapus laporan
 */
async function remove(id) {
    await pool.query('DELETE FROM laporan_kerusakan WHERE id=?', [id]);
}

module.exports = {
    getAll,
    getAlatStok,
    create,
    kurangiStokAlat,
    kembalikanStokAlat,
    getById,
    updateStatus,
    remove
};