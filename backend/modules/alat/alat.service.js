const pool = require('../../config/db');

/**
 * Ambil semua alat, optional filter lab_id
 */
async function getAll(labId = null) {
    let query = 'SELECT * FROM alat';
    const params = [];

    if (labId) {
        query += ' WHERE lab_id = ?';
        params.push(labId);
    }

    query += ' ORDER BY kode_alat';
    const [rows] = await pool.query(query, params);
    return rows;
}

/**
 * Tambah alat
 */
async function create(kode_alat, nama_alat, spek, produsen, jumlah, lab_id, keterangan) {
    const [result] = await pool.query(
        'INSERT INTO alat (kode_alat, nama_alat, spek, produsen, jumlah, lab_id, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [kode_alat, nama_alat, spek, produsen, jumlah, lab_id, keterangan]
    );
    return result;
}

/**
 * Update alat
 */
async function update(id, kode_alat, nama_alat, spek, produsen, jumlah, jumlah_rusak, kondisi, lab_id, keterangan) {
    const [result] = await pool.query(
        'UPDATE alat SET kode_alat=?, nama_alat=?, spek=?, produsen=?, jumlah=?, jumlah_rusak=?, kondisi=?, lab_id=?, keterangan=? WHERE id=?',
        [kode_alat, nama_alat, spek, produsen, jumlah, jumlah_rusak, kondisi, lab_id, keterangan, id]
    );
    return result;
}

/**
 * Hapus alat
 */
async function remove(id) {
    const [result] = await pool.query('DELETE FROM alat WHERE id=?', [id]);
    return result;
}

module.exports = { getAll, create, update, remove };