const fs = require('fs');
const alatService = require('./alat.service');
const { success, error, errorWithDetails } = require('../../shared/utils/response');

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

async function create(req, res) {
    const { kode_alat, nama_alat, spek, produsen, jumlah, lab_id, keterangan } = req.body;
    if (!kode_alat || !nama_alat || !jumlah) {
        return error(res, 'Kode, nama, dan jumlah wajib diisi', 400);
    }
    try {
        const result = await alatService.create(
            kode_alat, nama_alat,
            spek || '-', produsen || '-',
            parseInt(jumlah), lab_id || 1, keterangan || ''
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

async function update(req, res) {
    const { id } = req.params;
    const { kode_alat, nama_alat, spek, produsen, jumlah, jumlah_rusak, kondisi, lab_id, keterangan } = req.body;
    try {
        const result = await alatService.update(
            id, kode_alat, nama_alat,
            spek || '-', produsen || '-',
            parseInt(jumlah), parseInt(jumlah_rusak) || 0, kondisi || 'baik',
            lab_id || 1, keterangan || ''
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

// POST /api/alat/import
async function importExcel(req, res) {
    const filePath = req.file ? req.file.path : null;
    try {
        if (!req.file) {
            return error(res, 'File Excel wajib diunggah', 400);
        }
        const labId = parseInt(req.body.lab_id, 10);
        if (!labId || labId <= 0) {
            return error(res, 'lab_id tidak valid', 400);
        }

        const result = await alatService.importFromExcel(labId, filePath);

        if (result.failed > 0) {
            return errorWithDetails(
                res,
                `Import dibatalkan: ${result.failed} baris bermasalah`,
                result,
                400
            );
        }
        return success(res, result, `Berhasil mengimpor ${result.inserted} baris alat`, 201);
    } catch (err) {
        const status = err.status || 500;
        return error(res, err.message || 'Gagal mengimpor data alat', status);
    } finally {
        if (filePath && fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (_) { /* ignore */ }
        }
    }
}

module.exports = { getAll, create, update, remove, importExcel };