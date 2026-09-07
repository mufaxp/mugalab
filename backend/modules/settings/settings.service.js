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

module.exports = { getPublicSettings, getAllSettings, updateSettings };