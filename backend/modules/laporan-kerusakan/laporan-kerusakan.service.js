const pool = require('../../config/db');

/**
 * Ambil semua laporan kerusakan (alat & sarana)
 * dengan filter lab_id opsional.
 */
async function getAll(labId = null) {
    let query = `
        SELECT lk.*,
            CASE WHEN lk.jenis = 'alat' THEN a.kode_alat ELSE s.kode_sarana END AS kode_item,
            CASE WHEN lk.jenis = 'alat' THEN a.nama_alat ELSE s.nama_sarana END AS nama_item,
            COALESCE(a.lab_id, s.lab_id) AS lab_id
        FROM laporan_kerusakan lk
        LEFT JOIN alat a ON lk.jenis = 'alat' AND lk.alat_id = a.id
        LEFT JOIN sarana s ON lk.jenis = 'sarana' AND lk.sarana_id = s.id
    `;
    const params = [];

    if (labId) {
        query += ' WHERE COALESCE(a.lab_id, s.lab_id) = ?';
        params.push(labId);
    }

    query += ' ORDER BY lk.created_at DESC';
    const [rows] = await pool.query(query, params);
    return rows;
}

/**
 * Ambil stok item (alat atau sarana)
 */
async function getStokItem(jenis, itemId) {
    const table = jenis === 'alat' ? 'alat' : 'sarana';
    const [rows] = await pool.query(`SELECT jumlah FROM ${table} WHERE id=?`, [itemId]);
    return rows[0] || null;
}

/**
 * Tambah laporan kerusakan
 */
async function create(jenis, itemId, jumlah_rusak, pelapor, tanggal_lapor, keterangan) {
    const alat_id = jenis === 'alat' ? itemId : null;
    const sarana_id = jenis === 'sarana' ? itemId : null;

    await pool.query(
        `INSERT INTO laporan_kerusakan
            (jenis, alat_id, sarana_id, jumlah_rusak, pelapor, tanggal_lapor, keterangan)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [jenis, alat_id, sarana_id, jumlah_rusak, pelapor, tanggal_lapor, keterangan]
    );
}

/**
 * Kurangi stok item & tambah jumlah_rusak
 */
async function kurangiStok(jenis, itemId, jumlahRusak) {
    const table = jenis === 'alat' ? 'alat' : 'sarana';
    await pool.query(
        `UPDATE ${table} SET jumlah = jumlah - ?, jumlah_rusak = jumlah_rusak + ? WHERE id = ?`,
        [jumlahRusak, jumlahRusak, itemId]
    );
}

/**
 * Kembalikan stok item & kurangi jumlah_rusak
 */
async function kembalikanStok(jenis, itemId, jumlahRusak) {
    const table = jenis === 'alat' ? 'alat' : 'sarana';
    await pool.query(
        `UPDATE ${table} SET jumlah = jumlah + ?, jumlah_rusak = jumlah_rusak - ? WHERE id = ?`,
        [jumlahRusak, jumlahRusak, itemId]
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

/**
 * Kurangi HANYA jumlah_rusak (untuk status "dibuang").
 * `jumlah` tidak disentuh karena item sudah dianggap keluar dari inventaris.
 */
async function kurangiJumlahRusak(jenis, itemId, jumlah) {
    const table = jenis === 'alat' ? 'alat' : 'sarana';
    await pool.query(
        `UPDATE ${table} SET jumlah_rusak = GREATEST(0, jumlah_rusak - ?) WHERE id = ?`,
        [jumlah, itemId]
    );
}

module.exports = {
    getAll,
    getStokItem,
    create,
    kurangiStok,
    kembalikanStok,
    kurangiJumlahRusak,
    getById,
    updateStatus,
    remove
};