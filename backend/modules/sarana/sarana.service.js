const pool = require('../../config/db');

/**
 * Ambil semua sarana, optional filter lab_id.
 * Menyertakan field "dipinjam" = jumlah yang sedang dipinjam.
 */
async function getAll(labId = null) {
    let query = `
        SELECT s.*,
            COALESCE((
                SELECT SUM(p.jumlah)
                FROM peminjaman p
                WHERE p.sarana_id = s.id AND p.status = 'dipinjam'
            ), 0) AS dipinjam
        FROM sarana s
    `;
    const params = [];

    if (labId) {
        query += ' WHERE s.lab_id = ?';
        params.push(labId);
    }

    query += ' ORDER BY s.kode_sarana';
    const [rows] = await pool.query(query, params);
    return rows;
}

/**
 * Tambah sarana
 */
async function create(kode_sarana, nama_sarana, spek, produsen, jumlah, lab_id, keterangan) {
    const [result] = await pool.query(
        'INSERT INTO sarana (kode_sarana, nama_sarana, spek, produsen, jumlah, lab_id, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [kode_sarana, nama_sarana, spek, produsen, jumlah, lab_id, keterangan]
    );
    return result;
}

/**
 * Update sarana
 */
async function update(id, kode_sarana, nama_sarana, spek, produsen, jumlah, jumlah_rusak, kondisi, lab_id, keterangan) {
    const [result] = await pool.query(
        'UPDATE sarana SET kode_sarana=?, nama_sarana=?, spek=?, produsen=?, jumlah=?, jumlah_rusak=?, kondisi=?, lab_id=?, keterangan=? WHERE id=?',
        [kode_sarana, nama_sarana, spek, produsen, jumlah, jumlah_rusak, kondisi, lab_id, keterangan, id]
    );
    return result;
}

/**
 * Hapus sarana
 */
async function remove(id) {
    const [result] = await pool.query('DELETE FROM sarana WHERE id=?', [id]);
    return result;
}

module.exports = { getAll, create, update, remove };