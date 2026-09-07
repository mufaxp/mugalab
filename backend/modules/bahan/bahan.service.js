const pool = require('../../config/db');

/**
 * Ambil semua bahan dengan filter lab_id opsional
 */
async function getAll(labId = null) {
    let query = 'SELECT * FROM bahan';
    const params = [];

    if (labId) {
        query += ' WHERE lab_id = ?';
        params.push(labId);
    }

    query += ' ORDER BY kode_bahan';
    const [rows] = await pool.query(query, params);
    return rows;
}

/**
 * Tambah bahan baru. stok_awal dan stok_akhir diisi sama.
 */
async function create(kode_bahan, nama_bahan, produsen, stok_awal, satuan, tanggal_kadaluarsa, lab_id, keterangan) {
    const [result] = await pool.query(
        'INSERT INTO bahan (kode_bahan, nama_bahan, produsen, stok_awal, stok_akhir, satuan, tanggal_kadaluarsa, lab_id, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [kode_bahan, nama_bahan, produsen, stok_awal, stok_awal, satuan, tanggal_kadaluarsa, lab_id, keterangan]
    );
    return result;
}

/**
 * Update bahan. stok_awal dan stok_akhir diupdate sesuai input.
 */
async function update(id, kode_bahan, nama_bahan, produsen, stok_awal, stok_akhir, satuan, tanggal_kadaluarsa, lab_id, keterangan) {
    const [result] = await pool.query(
        'UPDATE bahan SET kode_bahan=?, nama_bahan=?, produsen=?, stok_awal=?, stok_akhir=?, satuan=?, tanggal_kadaluarsa=?, lab_id=?, keterangan=? WHERE id=?',
        [kode_bahan, nama_bahan, produsen, stok_awal, stok_akhir, satuan, tanggal_kadaluarsa, lab_id, keterangan, id]
    );
    return result;
}

/**
 * Hapus bahan
 */
async function remove(id) {
    const [result] = await pool.query('DELETE FROM bahan WHERE id=?', [id]);
    return result;
}

/**
 * Ambil stok bahan berdasarkan id
 */
async function getStokById(id) {
    const [rows] = await pool.query('SELECT stok_akhir FROM bahan WHERE id=?', [id]);
    return rows[0] || null;
}

/**
 * Kurangi stok akhir bahan
 */
async function kurangiStok(id, jumlah) {
    await pool.query('UPDATE bahan SET stok_akhir = stok_akhir - ? WHERE id = ?', [jumlah, id]);
}

/**
 * Catat penggunaan bahan ke tabel penggunaan_bahan
 */
async function catatPenggunaan(bahan_id, jumlah_digunakan, penanggung_jawab, kelas, kegiatan, tanggal) {
    await pool.query(
        'INSERT INTO penggunaan_bahan (bahan_id, jumlah_digunakan, penanggung_jawab, kelas, kegiatan, tanggal) VALUES (?, ?, ?, ?, ?, ?)',
        [bahan_id, jumlah_digunakan, penanggung_jawab, kelas, kegiatan, tanggal]
    );
}

/**
 * Ambil riwayat penggunaan bahan dengan join bahan
 */
async function getRiwayat(bahanId = null, labId = null) {
    let query = `SELECT pb.*, b.nama_bahan, b.satuan, b.lab_id 
                 FROM penggunaan_bahan pb 
                 JOIN bahan b ON pb.bahan_id = b.id`;
    const params = [];
    const conditions = [];

    if (bahanId) {
        conditions.push('pb.bahan_id = ?');
        params.push(bahanId);
    }
    if (labId) {
        conditions.push('b.lab_id = ?');
        params.push(labId);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY pb.tanggal DESC, pb.created_at DESC LIMIT 100';
    const [rows] = await pool.query(query, params);
    return rows;
}

/**
 * Hapus riwayat penggunaan bahan
 */
async function hapusRiwayat(id) {
    const [result] = await pool.query('DELETE FROM penggunaan_bahan WHERE id = ?', [id]);
    return result;
}

module.exports = {
    getAll,
    create,
    update,
    remove,
    getStokById,
    kurangiStok,
    catatPenggunaan,
    getRiwayat,
    hapusRiwayat
};