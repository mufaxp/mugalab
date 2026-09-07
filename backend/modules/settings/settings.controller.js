const settingsService = require('./settings.service');
const { success, error } = require('../../shared/utils/response');

/**
 * GET pengaturan publik (nama_sekolah, nama_lab)
 */
async function getPublic(req, res) {
    try {
        const data = await settingsService.getPublicSettings();
        return success(res, data);
    } catch (err) {
        console.error('Error ambil settings publik:', err);
        return error(res, 'Gagal mengambil pengaturan');
    }
}

/**
 * GET semua pengaturan (admin)
 */
async function getAll(req, res) {
    try {
        const data = await settingsService.getAllSettings();
        return success(res, data);
    } catch (err) {
        console.error('Error ambil settings:', err);
        return error(res, 'Gagal mengambil pengaturan');
    }
}

/**
 * PUT update pengaturan (nama_sekolah, nama_lab)
 */
async function update(req, res) {
    const { nama_sekolah, nama_lab } = req.body;

    // Validasi
    if (!nama_sekolah || !nama_lab) {
        return error(res, 'Nama sekolah dan nama lab wajib diisi', 400);
    }

    try {
        await settingsService.updateSettings(nama_sekolah, nama_lab);
        return success(res, null, 'Pengaturan berhasil disimpan');
    } catch (err) {
        console.error('Error update settings:', err);
        return error(res, 'Gagal menyimpan pengaturan');
    }
}

module.exports = { getPublic, getAll, update };