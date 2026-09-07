const userService = require('./user.service');
const bcrypt = require('bcryptjs');
const { success, error } = require('../../shared/utils/response');

/**
 * Ambil semua user (tanpa password)
 */
async function getAll(req, res) {
    try {
        const data = await userService.getAll();
        return success(res, data);
    } catch (err) {
        console.error('Error ambil user:', err);
        return error(res, 'Gagal mengambil data user');
    }
}

/**
 * Tambah user baru
 */
async function create(req, res) {
    const { username, password, nama, role } = req.body;

    // Validasi
    if (!username || !password || !nama || !role) {
        return error(res, 'Semua field wajib diisi', 400);
    }

    // Validasi role
    const allowedRoles = ['admin', 'laboran', 'guru'];
    if (!allowedRoles.includes(role)) {
        return error(res, 'Role tidak valid', 400);
    }

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await userService.create(username, hashedPassword, nama, role);
        return success(res, { id: result.insertId }, 'User berhasil ditambahkan', 201);
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return error(res, 'Username sudah digunakan', 400);
        }
        console.error('Error tambah user:', err);
        return error(res, 'Gagal menambahkan user');
    }
}

/**
 * Update user (password opsional)
 */
async function update(req, res) {
    const { id } = req.params;
    const { nama, role, password } = req.body;

    // Validasi role jika dikirim
    const allowedRoles = ['admin', 'laboran', 'guru'];
    if (role && !allowedRoles.includes(role)) {
        return error(res, 'Role tidak valid', 400);
    }

    try {
        // Cek user
        const user = await userService.getById(id);
        if (!user) {
            return error(res, 'User tidak ditemukan', 404);
        }

        // Jika password diisi, hash password baru
        let hashedPassword = null;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        await userService.update(id, nama || user.nama, role || user.role, hashedPassword);
        return success(res, null, 'User berhasil diperbarui');
    } catch (err) {
        console.error('Error update user:', err);
        return error(res, 'Gagal memperbarui user');
    }
}

/**
 * Hapus user
 */
async function remove(req, res) {
    const { id } = req.params;

    try {
        const user = await userService.getById(id);
        if (!user) {
            return error(res, 'User tidak ditemukan', 404);
        }

        await userService.remove(id);
        return success(res, null, 'User berhasil dihapus');
    } catch (err) {
        console.error('Error hapus user:', err);
        return error(res, 'Gagal menghapus user');
    }
}

module.exports = { getAll, create, update, remove };