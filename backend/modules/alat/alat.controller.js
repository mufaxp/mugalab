const alatService = require('./alat.service');
const { success, error } = require('../../shared/utils/response');

/**
 * Ambil semua data alat (dengan filter lab opsional)
 */
async function getAll(req, res) {
    const { lab_id } = req.query;

    try {
        const data = await alatService.getAll(lab_id || null);
        return success(res, data);
    } catch (err) {
        console.error('Error fetching alat:', err);
        return error(res, 'Gagal mengambil data alat');
    }
}

/**
 * Tambah alat baru
 */
async function create(req, res) {
    const { kode_alat, nama_alat, spek, produsen, jumlah, lab_id, keterangan } = req.body;

    // Validasi field wajib
    if (!kode_alat || !nama_alat || !jumlah) {
        return error(res, 'Kode, nama, dan jumlah wajib diisi', 400);
    }

    try {
        const result = await alatService.create(
            kode_alat,
            nama_alat,
            spek || '-',
            produsen || '-',
            parseInt(jumlah),
            lab_id || 1,
            keterangan || ''
        );
        return success(res, { id: result.insertId }, 'Data alat berhasil ditambahkan', 201);
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return error(res, 'Kode alat sudah digunakan', 400);
        }
        console.error('Error adding alat:', err);
        return error(res, 'Gagal menambahkan data alat');
    }
}

/**
 * Edit data alat
 */
async function update(req, res) {
    const { id } = req.params;
    const { kode_alat, nama_alat, spek, produsen, jumlah, jumlah_rusak, kondisi, lab_id, keterangan } = req.body;

    try {
        const result = await alatService.update(
            id,
            kode_alat,
            nama_alat,
            spek || '-',
            produsen || '-',
            parseInt(jumlah),
            parseInt(jumlah_rusak) || 0,
            kondisi || 'baik',
            lab_id || 1,
            keterangan || ''
        );

        if (result.affectedRows === 0) {
            return error(res, 'Alat tidak ditemukan', 404);
        }
        return success(res, null, 'Data alat berhasil diperbarui');
    } catch (err) {
        console.error('Error updating alat:', err);
        return error(res, 'Gagal memperbarui data alat');
    }
}

/**
 * Hapus alat
 */
async function remove(req, res) {
    const { id } = req.params;

    try {
        const result = await alatService.remove(id);
        if (result.affectedRows === 0) {
            return error(res, 'Alat tidak ditemukan', 404);
        }
        return success(res, null, 'Data alat berhasil dihapus');
    } catch (err) {
        console.error('Error menghapus alat:', err);
        return error(res, 'Gagal menghapus data alat');
    }
}

module.exports = { getAll, create, update, remove };