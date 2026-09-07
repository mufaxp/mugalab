const pool = require('../../config/db');

/**
 * Ambil semua pengajuan
 */
async function getAll() {
    const [rows] = await pool.query('SELECT * FROM pengajuan_jadwal ORDER BY created_at DESC');
    return rows;
}

/**
 * Ambil pengajuan berdasarkan ID
 */
async function getById(id) {
    const [rows] = await pool.query('SELECT * FROM pengajuan_jadwal WHERE id = ?', [id]);
    return rows[0] || null;
}

/**
 * Buat pengajuan baru
 */
async function create(data) {
    const [result] = await pool.query(
        `INSERT INTO pengajuan_jadwal (
            pengaju, nomor_wa, penanggung_jawab, mata_pelajaran, kegiatan,
            kelas, tanggal, jam_mulai, jam_selesai, lab_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            data.pengaju,
            data.nomor_wa,
            data.penanggung_jawab,
            data.mata_pelajaran,
            data.kegiatan,
            data.kelas,
            data.tanggal,
            data.jam_mulai,
            data.jam_selesai,
            data.lab_id
        ]
    );
    return result;
}

/**
 * Update status pengajuan
 */
async function updateStatus(id, status, alasanTolak, processedBy) {
    await pool.query(
        `UPDATE pengajuan_jadwal 
         SET status = ?, alasan_tolak = ?, processed_at = NOW(), processed_by = ? 
         WHERE id = ?`,
        [status, alasanTolak, processedBy, id]
    );
}

/**
 * Masukkan pengajuan yang diterima ke tabel jadwal
 */
async function insertJadwal(pengajuan) {
    await pool.query(
        `INSERT INTO jadwal (
            penanggung_jawab, kegiatan, mata_pelajaran, kelas,
            tanggal, jam_mulai, jam_selesai, lab_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            pengajuan.penanggung_jawab,
            pengajuan.kegiatan,
            pengajuan.mata_pelajaran || '',
            pengajuan.kelas || '',
            pengajuan.tanggal,
            pengajuan.jam_mulai,
            pengajuan.jam_selesai,
            pengajuan.lab_id
        ]
    );
}

module.exports = {
    getAll,
    getById,
    create,
    updateStatus,
    insertJadwal
};