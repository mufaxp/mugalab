const pool = require('../../config/db');

/**
 * Ambil semua user tanpa password
 */
async function getAll() {
    const [rows] = await pool.query(
        'SELECT id, username, nama, role, created_at FROM users ORDER BY id'
    );
    return rows;
}

/**
 * Ambil user berdasarkan ID
 */
async function getById(id) {
    const [rows] = await pool.query(
        'SELECT id, username, nama, role FROM users WHERE id = ?',
        [id]
    );
    return rows[0] || null;
}

/**
 * Tambah user baru
 */
async function create(username, hashedPassword, nama, role) {
    const [result] = await pool.query(
        'INSERT INTO users (username, password, nama, role) VALUES (?, ?, ?, ?)',
        [username, hashedPassword, nama, role]
    );
    return result;
}

/**
 * Update user; jika password tidak diubah, jangan update kolom password
 */
async function update(id, nama, role, hashedPassword = null) {
    if (hashedPassword) {
        await pool.query(
            'UPDATE users SET nama = ?, role = ?, password = ? WHERE id = ?',
            [nama, role, hashedPassword, id]
        );
    } else {
        await pool.query(
            'UPDATE users SET nama = ?, role = ? WHERE id = ?',
            [nama, role, id]
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