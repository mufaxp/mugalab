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

async function uploadTemplate(req, res) {
    if (!req.file) return error(res, 'File template tidak ditemukan', 400);
    try {
        // Simpan path relatif di settings? Tidak perlu, karena file selalu di folder tetap.
        // Kita hanya perlu memberi respons sukses.
        return success(res, null, 'Template berhasil diunggah');
    } catch (err) {
        console.error('Error upload template:', err);
        return error(res, 'Gagal mengunggah template');
    }
}

/**
 * GET konfigurasi izin per role
 * Akses: semua user yang login (dibutuhkan untuk filter sidebar)
 */
async function getRolePermissions(req, res) {
    try {
        const data = await settingsService.getRolePermissions();
        return success(res, data);
    } catch (err) {
        console.error('Error get role permissions:', err);
        return error(res, 'Gagal mengambil izin role');
    }
}

/**
 * PUT update konfigurasi izin per role
 * Akses: admin saja
 */
async function updateRolePermissions(req, res) {
    const perms = req.body;

    if (!perms || typeof perms !== 'object') {
        return error(res, 'Data tidak valid', 400);
    }

    // Validasi: 3 role wajib ada
    for (const role of ['admin', 'laboran', 'guru']) {
        if (!Array.isArray(perms[role])) {
            return error(res, `Role "${role}" harus berupa array`, 400);
        }
    }

    // Kunci keamanan: panel "setting" WAJIB ada di admin
    if (!perms.admin.includes('setting')) {
        return error(res, 'Panel "Pengaturan" wajib aktif untuk admin', 400);
    }

    try {
        await settingsService.updateRolePermissions(perms);
        return success(res, null, 'Izin role berhasil disimpan');
    } catch (err) {
        console.error('Error update role permissions:', err);
        return error(res, 'Gagal menyimpan izin role');
    }
}

module.exports = { getPublic, getAll, update, uploadTemplate, getRolePermissions, updateRolePermissions };