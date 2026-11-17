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
                role: user.role,
                mata_pelajaran: user.mata_pelajaran
            },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        // Kirim token + data penting
        return success(res, {
            token,
            nama: user.nama,
            role: user.role,
            mata_pelajaran: user.mata_pelajaran
        }, 'Login berhasil', 200);
    } catch (err) {
        console.error('Login error:', err);
        return error(res, 'Terjadi kesalahan server');
    }
}

async function loginFace(req, res) {
    const { username, descriptor } = req.body;

    if (!username || !descriptor) {
        return error(res, 'Username dan data wajah wajib dikirim', 400);
    }

    try {
        const user = await authService.getUserByUsername(username);
        if (!user || !user.face_descriptor) {
            return error(res, 'User belum mendaftarkan wajah', 401);
        }

        // 1. Parse data
        let savedDesc, incomingDesc;
        try {
            savedDesc = JSON.parse(user.face_descriptor);
            incomingDesc = JSON.parse(descriptor);
        } catch (e) {
            return error(res, 'Format data wajah tidak valid', 400);
        }

        // 2. Validasi Array (Mencegah NaN Bug)
        if (!Array.isArray(savedDesc) || !Array.isArray(incomingDesc)) {
            return error(res, 'Data wajah harus berupa array', 400);
        }
        if (savedDesc.length !== 128 || incomingDesc.length !== 128) {
            return error(res, 'Data wajah tidak lengkap (harus 128 dimensi)', 400);
        }

        // 3. Hitung Euclidean Distance
        let sum = 0;
        for (let i = 0; i < savedDesc.length; i++) {
            sum += Math.pow(savedDesc[i] - incomingDesc[i], 2);
        }
        const distance = Math.sqrt(sum);

        // 4. Validasi Hasil
        if (isNaN(distance)) {
            return error(res, 'Gagal menghitung kemiripan wajah', 500);
        }

        // Threshold 0.4 adalah standar face-api.js
        // Jarak < 0.4 = Mirip, Jarak > 0.4 = Beda
        if (distance > 0.4) {
            console.log(`Login gagal. Jarak wajah: ${distance.toFixed(4)} (Terlalu jauh)`);
            return error(res, 'Wajah tidak cocok', 401);
        }

        console.log(`Login berhasil. Jarak wajah: ${distance.toFixed(4)}`);

        // Buat JWT
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                nama: user.nama,
                role: user.role,
                mata_pelajaran: user.mata_pelajaran
            },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        return success(res, {
            token,
            nama: user.nama,
            role: user.role,
            mata_pelajaran: user.mata_pelajaran
        }, 'Login wajah berhasil', 200);
    } catch (err) {
        console.error('Login face error:', err);
        return error(res, 'Terjadi kesalahan server');
    }
}

module.exports = { login, loginFace };