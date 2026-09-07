const pool = require('../../config/db');

/**
 * Ambil semua laporan praktikum dengan filter lab_id opsional
 */
async function getAll(labId = null) {
    let query = 'SELECT * FROM laporan_praktikum';
    const params = [];

    if (labId) {
        query += ' WHERE lab_id = ?';
        params.push(labId);
    }

    query += ' ORDER BY tanggal DESC, created_at DESC';
    const [rows] = await pool.query(query, params);
    return rows;
}

/**
 * Buat laporan praktikum baru
 */
async function create(data) {
    const [result] = await pool.query(
        `INSERT INTO laporan_praktikum (
            jadwal_id, kelas, jumlah_kelompok, mata_pelajaran, jam_mulai, jam_selesai,
            guru_mapel, judul_praktikum, tujuan_praktikum, daftar_alat_bahan,
            deskripsi_kegiatan, tanggal, lab_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            data.jadwal_id,
            data.kelas,
            data.jumlah_kelompok,
            data.mata_pelajaran,
            data.jam_mulai,
            data.jam_selesai,
            data.guru_mapel,
            data.judul_praktikum,
            data.tujuan_praktikum,
            data.daftar_alat_bahan,
            data.deskripsi_kegiatan,
            data.tanggal,
            data.lab_id
        ]
    );
    return result;
}

/**
 * Update laporan praktikum
 */
async function update(id, data) {
    const [result] = await pool.query(
        `UPDATE laporan_praktikum SET
            kelas=?, jumlah_kelompok=?, mata_pelajaran=?, jam_mulai=?, jam_selesai=?,
            guru_mapel=?, judul_praktikum=?, tujuan_praktikum=?, daftar_alat_bahan=?,
            deskripsi_kegiatan=?, tanggal=?, lab_id=?
        WHERE id=?`,
        [
            data.kelas,
            data.jumlah_kelompok,
            data.mata_pelajaran,
            data.jam_mulai,
            data.jam_selesai,
            data.guru_mapel,
            data.judul_praktikum,
            data.tujuan_praktikum,
            data.daftar_alat_bahan,
            data.deskripsi_kegiatan,
            data.tanggal,
            data.lab_id,
            id
        ]
    );
    return result;
}

/**
 * Hapus laporan praktikum
 */
async function remove(id) {
    const [result] = await pool.query('DELETE FROM laporan_praktikum WHERE id = ?', [id]);
    return result;
}

module.exports = { getAll, create, update, remove };