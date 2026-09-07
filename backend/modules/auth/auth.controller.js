const authService = require('./auth.service');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { success, error } = require('../../shared/utils/response');

/**
 * Login user
 */
async function login(req, res) {
    const { username, password } = req.body;

    // Validasi input
    if (!username || !password) {
        return error(res, 'Username dan password wajib diisi', 400);
    }

    try {
        // Cari user berdasarkan username
        const user = await authService.getUserByUsername(username);
        if (!user) {
            return error(res, 'Username atau password salah', 401);
        }

        // Verifikasi password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return error(res, 'Username atau password salah', 401);
        }

        // Buat JWT token
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                nama: user.nama,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        // Kirim token + data penting
        return success(res, {
            token,
            nama: user.nama,
            role: user.role
        }, 'Login berhasil', 200);
    } catch (err) {
        console.error('Login error:', err);
        return error(res, 'Terjadi kesalahan server');
    }
}

module.exports = { login };