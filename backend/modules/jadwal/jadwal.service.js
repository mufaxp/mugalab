const pool = require('../../config/db');

/**
 * Ambil jadwal mingguan (publik, tanpa has_laporan)
 */
async function getJadwalMingguan(mingguMulai, labId = null) {
    let query = `SELECT * FROM jadwal WHERE tanggal >= ? AND tanggal <= DATE_ADD(?, INTERVAL 6 DAY)`;
    const params = [mingguMulai, mingguMulai];

    if (labId) {
        query += ' AND lab_id = ?';
        params.push(labId);
    }

    query += ' ORDER BY tanggal, jam_mulai';
    const [rows] = await pool.query(query, params);
    return rows;
}

/**
 * Ambil jadwal mingguan dengan info has_laporan
 */
async function getJadwalMingguanWithLaporan(mingguMulai, labId = null) {
    let query = `
        SELECT j.*, 
            CASE WHEN lp.id IS NOT NULL THEN true ELSE false END as has_laporan
        FROM jadwal j 
        LEFT JOIN laporan_praktikum lp ON j.id = lp.jadwal_id
        WHERE j.tanggal >= ? AND j.tanggal <= DATE_ADD(?, INTERVAL 6 DAY)
    `;
    const params = [mingguMulai, mingguMulai];

    if (labId) {
        query += ' AND j.lab_id = ?';
        params.push(labId);
    }

    query += ' ORDER BY j.tanggal, j.jam_mulai';
    const [rows] = await pool.query(query, params);
    return rows;
}

/**
 * Tambah jadwal
 */
async function create(penanggung_jawab, kegiatan, kelas, tanggal, jam_mulai, jam_selesai, lab_id) {
    const [result] = await pool.query(
        'INSERT INTO jadwal (penanggung_jawab, kegiatan, kelas, tanggal, jam_mulai, jam_selesai, lab_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [penanggung_jawab, kegiatan, kelas, tanggal, jam_mulai, jam_selesai, lab_id]
    );
    return result;
}

/**
 * Update jadwal
 */
async function update(id, penanggung_jawab, kegiatan, kelas, tanggal, jam_mulai, jam_selesai, lab_id) {
    const [result] = await pool.query(
        'UPDATE jadwal SET penanggung_jawab = ?, kegiatan = ?, kelas = ?, tanggal = ?, jam_mulai = ?, jam_selesai = ?, lab_id = ? WHERE id = ?',
        [penanggung_jawab, kegiatan, kelas, tanggal, jam_mulai, jam_selesai, lab_id, id]
    );
    return result;
}

/**
 * Hapus jadwal
 */
async function remove(id) {
    const [result] = await pool.query('DELETE FROM jadwal WHERE id = ?', [id]);
    return result;
}

module.exports = {
    getJadwalMingguan,
    getJadwalMingguanWithLaporan,
    create,
    update,
    remove
};