const pool = require('../../config/db');

/**
 * Ambil user berdasarkan username
 */
async function getUserByUsername(username) {
    const [rows] = await pool.query(
        'SELECT * FROM users WHERE username = ?',
        [username]
    );
    return rows[0] || null;
}

module.exports = { getUserByUsername };