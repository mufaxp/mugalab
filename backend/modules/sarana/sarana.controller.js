const saranaService = require('./sarana.service');
const { success, error } = require('../../shared/utils/response');

/**
 * GET semua sarana dengan filter lab_id opsional
 */
async function getAll(req, res) {
    const { lab_id } = req.query;

    try {
        const data = await saranaService.getAll(lab_id || null);
        return success(res, data);
    } catch (err) {
        console.error('Error fetching sarana:', err);
        return error(res, 'Gagal mengambil data sarana');
    }
}

/**
 * POST tambah sarana
 */
async function create(req, res) {
    const { kode_sarana, nama_sarana, spek, produsen, jumlah, lab_id, keterangan } = req.body;

    // Validasi
    if (!kode_sarana || !nama_sarana || !jumlah) {
        return error(res, 'Kode, nama, dan jumlah wajib diisi', 400);
    }

    try {
        const result = await saranaService.create(
            kode_sarana,
            nama_sarana,
            spek || '-',
            produsen || '-',
            parseInt(jumlah),
            lab_id || 1,
            keterangan || ''
        );
        return success(res, { id: result.insertId }, 'Sarana berhasil ditambahkan', 201);
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return error(res, 'Kode sarana sudah digunakan', 400);
        }
        console.error('Error adding sarana:', err);
        return error(res, 'Gagal menambahkan sarana');
    }
}

/**
 * PUT edit sarana
 */
async function update(req, res) {
    const { id } = req.params;
    const { kode_sarana, nama_sarana, spek, produsen, jumlah, jumlah_rusak, kondisi, lab_id, keterangan } = req.body;

    try {
        const result = await saranaService.update(
            id,
            kode_sarana,
            nama_sarana,
            spek || '-',
            produsen || '-',
            parseInt(jumlah),
            parseInt(jumlah_rusak) || 0,
            kondisi || 'baik',
            lab_id || 1,
            keterangan || ''
        );

        if (result.affectedRows === 0) {
            return error(res, 'Sarana tidak ditemukan', 404);
        }
        return success(res, null, 'Sarana berhasil diperbarui');
    } catch (err) {
        console.error('Error updating sarana:', err);
        return error(res, 'Gagal memperbarui sarana');
    }
}

/**
 * DELETE sarana
 */
async function remove(req, res) {
    const { id } = req.params;

    try {
        const result = await saranaService.remove(id);
        if (result.affectedRows === 0) {
            return error(res, 'Sarana tidak ditemukan', 404);
        }
        return success(res, null, 'Sarana berhasil dihapus');
    } catch (err) {
        console.error('Error menghapus sarana:', err);
        return error(res, 'Gagal menghapus sarana');
    }
}

module.exports = { getAll, create, update, remove };