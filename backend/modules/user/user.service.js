const pool = require('../../config/db');

/**
 * Ambil semua user tanpa password
 */
async function getAll() {
    const [rows] = await pool.query(
        'SELECT id, username, nama, role, mata_pelajaran, created_at FROM users ORDER BY id'
    );
    return rows;
}

/**
 * Ambil user berdasarkan ID
 */
async function getById(id) {
    const [rows] = await pool.query(
        'SELECT id, username, nama, role, mata_pelajaran FROM users WHERE id = ?',
        [id]
    );
    return rows[0] || null;
}

/**
 * Tambah user baru
 */
async function create(username, hashedPassword, nama, role, mata_pelajaran) {
    const [result] = await pool.query(
        'INSERT INTO users (username, password, nama, role, mata_pelajaran) VALUES (?, ?, ?, ?, ?)',
        [username, hashedPassword, nama, role, mata_pelajaran]
    );
    return result;
}

/**
 * Update user; jika password tidak diubah, jangan update kolom password
 */
async function update(id, nama, role, mata_pelajaran, hashedPassword = null) {
    if (hashedPassword) {
        await pool.query(
            'UPDATE users SET nama = ?, role = ?, mata_pelajaran = ?, password = ? WHERE id = ?',
            [nama, role, mata_pelajaran, hashedPassword, id]
        );
    } else {
        await pool.query(
            'UPDATE users SET nama = ?, role = ?, mata_pelajaran = ? WHERE id = ?',
            [nama, role, mata_pelajaran, id]
        );
    }
}

/**
 * Hapus user
 */
async function remove(id) {
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
}

module.exports = { getAll, getById, create, update, remove };