const pool = require('../../config/db');

/**
 * Ambil pengaturan publik: nama_sekolah, nama_lab
 */
async function getPublicSettings() {
    const [rows] = await pool.query(
        `SELECT setting_key, setting_value 
         FROM settings 
         WHERE setting_key IN ('nama_sekolah', 'nama_lab')`
    );

    const settings = {};
    rows.forEach(r => {
        settings[r.setting_key] = r.setting_value;
    });
    return settings;
}

/**
 * Ambil semua pengaturan
 */
async function getAllSettings() {
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM settings');
    return rows;
}

/**
 * Update atau insert pengaturan nama_sekolah & nama_lab
 */
async function updateSettings(nama_sekolah, nama_lab) {
    await pool.query(
        `INSERT INTO settings (setting_key, setting_value) 
         VALUES ('nama_sekolah', ?), ('nama_lab', ?) 
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [nama_sekolah, nama_lab]
    );
}

/**
 * Daftar default izin role (dipakai jika belum pernah disimpan di DB)
 */
const DEFAULT_ROLE_PERMISSIONS = {
    admin:   ['jadwal','inventaris','laporan','riwayat','laporan-praktikum','pengajuan','peminjaman','setting'],
    laboran: ['jadwal','inventaris','laporan','riwayat','laporan-praktikum','pengajuan','peminjaman'],
    guru:    ['jadwal','inventaris','laporan','riwayat','laporan-praktikum','peminjaman']
};

/**
 * Ambil konfigurasi izin per role
 */
async function getRolePermissions() {
    const [rows] = await pool.query(
        "SELECT setting_value FROM settings WHERE setting_key = 'role_permissions'"
    );
    if (!rows.length || !rows[0].setting_value) {
        return DEFAULT_ROLE_PERMISSIONS;
    }
    try {
        const parsed = JSON.parse(rows[0].setting_value);
        // Pastikan 3 role kunci selalu ada
        return {
            admin:   parsed.admin   || DEFAULT_ROLE_PERMISSIONS.admin,
            laboran: parsed.laboran || DEFAULT_ROLE_PERMISSIONS.laboran,
            guru:    parsed.guru    || DEFAULT_ROLE_PERMISSIONS.guru
        };
    } catch (e) {
        return DEFAULT_ROLE_PERMISSIONS;
    }
}

/**
 * Simpan konfigurasi izin per role (upsert ke tabel settings)
 */
async function updateRolePermissions(perms) {
    const value = JSON.stringify(perms);
    await pool.query(
        `INSERT INTO settings (setting_key, setting_value)
         VALUES ('role_permissions', ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [value]
    );
}

module.exports = { getPublicSettings, getAllSettings, updateSettings, getRolePermissions, updateRolePermissions };