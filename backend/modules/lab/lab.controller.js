const labService = require('./lab.service');
const { success, error } = require('../../shared/utils/response');

/**
 * Ambil semua data lab
 */
async function getAll(req, res) {
    try {
        const data = await labService.getAll();
        return success(res, data);
    } catch (err) {
        console.error('Error fetching lab:', err);
        return error(res, 'Gagal mengambil data lab');
    }
}

/**
 * Tambah lab baru
 */
async function create(req, res) {
    const { nama, deskripsi } = req.body;

    // Validasi
    if (!nama) {
        return error(res, 'Nama lab wajib diisi', 400);
    }

    try {
        const result = await labService.create(nama, deskripsi);
        return success(res, { id: result.insertId }, 'Lab berhasil ditambahkan', 201);
    } catch (err) {
        console.error('Error tambah lab:', err);
        return error(res, 'Gagal menambahkan lab');
    }
}

/**
 * Edit data lab
 */
async function update(req, res) {
    const { id } = req.params;
    const { nama, deskripsi } = req.body;

    if (!nama) {
        return error(res, 'Nama lab wajib diisi', 400);
    }

    try {
        const result = await labService.update(id, nama, deskripsi);
        if (result.affectedRows === 0) {
            return error(res, 'Lab tidak ditemukan', 404);
        }
        return success(res, null, 'Lab berhasil diperbarui');
    } catch (err) {
        console.error('Error edit lab:', err);
        return error(res, 'Gagal memperbarui lab');
    }
}

/**
 * Hapus lab (dengan pengecekan referensi)
 */
async function remove(req, res) {
    const { id } = req.params;

    try {
        // Cek apakah lab masih dipakai di tabel lain
        const inUse = await labService.checkInUse(id);
        if (inUse > 0) {
            return error(
                res,
                `Lab tidak bisa dihapus karena masih digunakan di ${inUse} data terkait. Pindahkan datanya terlebih dahulu.`,
                400
            );
        }

        await labService.remove(id);
        return success(res, null, 'Lab berhasil dihapus');
    } catch (err) {
        console.error('Error hapus lab:', err);
        return error(res, 'Gagal menghapus lab');
    }
}

module.exports = { getAll, create, update, remove };