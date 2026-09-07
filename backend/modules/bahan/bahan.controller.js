const bahanService = require('./bahan.service');
const { success, error } = require('../../shared/utils/response');

/**
 * GET semua bahan dengan filter lab_id opsional
 */
async function getAll(req, res) {
    const { lab_id } = req.query;

    try {
        const data = await bahanService.getAll(lab_id || null);
        return success(res, data);
    } catch (err) {
        console.error('Error fetching bahan:', err);
        return error(res, 'Gagal mengambil data bahan');
    }
}

/**
 * POST tambah bahan baru
 */
async function create(req, res) {
    const { kode_bahan, nama_bahan, produsen, stok_awal, satuan, tanggal_kadaluarsa, lab_id, keterangan } = req.body;

    // Validasi field wajib
    if (!kode_bahan || !nama_bahan || !stok_awal) {
        return error(res, 'Kode, nama, dan stok awal wajib diisi', 400);
    }

    try {
        const result = await bahanService.create(
            kode_bahan,
            nama_bahan,
            produsen || '-',
            parseFloat(stok_awal),
            satuan || 'gram',
            tanggal_kadaluarsa || null,
            lab_id || 1,
            keterangan || ''
        );
        return success(res, { id: result.insertId }, 'Bahan berhasil ditambahkan', 201);
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return error(res, 'Kode bahan sudah digunakan', 400);
        }
        console.error('Error adding bahan:', err);
        return error(res, 'Gagal menambahkan bahan');
    }
}

/**
 * PUT edit bahan
 */
async function update(req, res) {
    const { id } = req.params;
    const { kode_bahan, nama_bahan, produsen, stok_awal, stok_akhir, satuan, tanggal_kadaluarsa, lab_id, keterangan } = req.body;

    try {
        const result = await bahanService.update(
            id,
            kode_bahan,
            nama_bahan,
            produsen || '-',
            parseFloat(stok_awal),
            parseFloat(stok_akhir),
            satuan || 'gram',
            tanggal_kadaluarsa || null,
            lab_id || 1,
            keterangan || ''
        );

        if (result.affectedRows === 0) {
            return error(res, 'Bahan tidak ditemukan', 404);
        }
        return success(res, null, 'Data bahan berhasil diperbarui');
    } catch (err) {
        console.error('Error updating bahan:', err);
        return error(res, 'Gagal memperbarui data bahan');
    }
}

/**
 * DELETE bahan
 */
async function remove(req, res) {
    const { id } = req.params;

    try {
        const result = await bahanService.remove(id);
        if (result.affectedRows === 0) {
            return error(res, 'Bahan tidak ditemukan', 404);
        }
        return success(res, null, 'Data bahan berhasil dihapus');
    } catch (err) {
        console.error('Error menghapus bahan:', err);
        return error(res, 'Gagal menghapus data bahan');
    }
}

/**
 * POST catat penggunaan bahan
 */
async function pakai(req, res) {
    const { bahan_id, jumlah_digunakan, penanggung_jawab, kelas, kegiatan, tanggal } = req.body;

    // Validasi
    if (!bahan_id || !jumlah_digunakan || !penanggung_jawab || !kegiatan || !tanggal) {
        return error(res, 'Kolom wajib diisi', 400);
    }

    try {
        // Cek stok bahan
        const bahan = await bahanService.getStokById(bahan_id);
        if (!bahan) {
            return error(res, 'Bahan tidak ditemukan', 404);
        }

        if (bahan.stok_akhir < parseFloat(jumlah_digunakan)) {
            return error(res, 'Stok tidak mencukupi', 400);
        }

        // Catat penggunaan
        await bahanService.catatPenggunaan(
            bahan_id,
            parseFloat(jumlah_digunakan),
            penanggung_jawab,
            kelas || '-',
            kegiatan,
            tanggal
        );

        // Kurangi stok
        await bahanService.kurangiStok(bahan_id, parseFloat(jumlah_digunakan));

        return success(res, null, 'Data penggunaan berhasil dicatat, stok berkurang', 200);
    } catch (err) {
        console.error('Error penggunaan bahan:', err);
        return error(res, 'Gagal mencatat penggunaan bahan');
    }
}

/**
 * GET riwayat penggunaan bahan
 */
async function getRiwayat(req, res) {
    const { bahan_id, lab_id } = req.query;

    try {
        const data = await bahanService.getRiwayat(bahan_id || null, lab_id || null);
        return success(res, data);
    } catch (err) {
        console.error('Error fetching penggunaan:', err);
        return error(res, 'Gagal mengambil riwayat');
    }
}

/**
 * DELETE riwayat penggunaan bahan
 */
async function hapusRiwayat(req, res) {
    const { id } = req.params;

    try {
        const result = await bahanService.hapusRiwayat(id);
        if (result.affectedRows === 0) {
            return error(res, 'Riwayat tidak ditemukan', 404);
        }
        return success(res, null, 'Riwayat berhasil dihapus (stok tidak berubah)');
    } catch (err) {
        console.error('Error deleting riwayat:', err);
        return error(res, 'Gagal menghapus riwayat');
    }
}

module.exports = { getAll, create, update, remove, pakai, getRiwayat, hapusRiwayat };