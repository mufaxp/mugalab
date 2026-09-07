const pool = require('../../config/db');

/**
 * Ambil semua data lab
 */
async function getAll() {
    const [rows] = await pool.query('SELECT * FROM lab ORDER BY id');
    return rows;
}

/**
 * Tambah lab baru
 */
async function create(nama, deskripsi) {
    const [result] = await pool.query(
        'INSERT INTO lab (nama, deskripsi) VALUES (?, ?)',
        [nama, deskripsi || '']
    );
    return result;
}

/**
 * Update lab
 */
async function update(id, nama, deskripsi) {
    const [result] = await pool.query(
        'UPDATE lab SET nama = ?, deskripsi = ? WHERE id = ?',
        [nama, deskripsi || '', id]
    );
    return result;
}

/**
 * Hitung total referensi lab di tabel lain
 */
async function checkInUse(id) {
    const queries = [
        'SELECT COUNT(*) as total FROM jadwal WHERE lab_id = ?',
        'SELECT COUNT(*) as total FROM alat WHERE lab_id = ?',
        'SELECT COUNT(*) as total FROM bahan WHERE lab_id = ?',
        'SELECT COUNT(*) as total FROM sarana WHERE lab_id = ?',
        'SELECT COUNT(*) as total FROM pengajuan_jadwal WHERE lab_id = ?'
    ];

    let total = 0;
    for (const q of queries) {
        const [rows] = await pool.query(q, [id]);
        total += rows[0].total;
    }
    return total;
}

/**
 * Hapus lab
 */
async function remove(id) {
    await pool.query('DELETE FROM lab WHERE id = ?', [id]);
}

module.exports = { getAll, create, update, checkInUse, remove };