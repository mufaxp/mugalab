const fs = require('fs');
const bahanService = require('./bahan.service');
const { success, error, errorWithDetails } = require('../../shared/utils/response');

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

async function create(req, res) {
    const { kode_bahan, nama_bahan, produsen, stok_awal, stok_akhir, satuan, tanggal_kadaluarsa, lab_id, keterangan } = req.body;
    if (!kode_bahan || !nama_bahan || !stok_awal) {
        return error(res, 'Kode, nama, dan stok awal wajib diisi', 400);
    }
    try {
        const stokAwal = parseFloat(stok_awal) || 0;
        const stokAkhir = stok_akhir !== undefined && stok_akhir !== '' ? parseFloat(stok_akhir) : stokAwal;
        const result = await bahanService.create(
            kode_bahan, nama_bahan, produsen || '-',
            stokAwal, stokAkhir,
            satuan || 'gram', tanggal_kadaluarsa || null,
            lab_id || 1, keterangan || ''
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

async function update(req, res) {
    const { id } = req.params;
    const { kode_bahan, nama_bahan, produsen, stok_awal, stok_akhir, satuan, tanggal_kadaluarsa, lab_id, keterangan } = req.body;
    try {
        const stokAwal = parseFloat(stok_awal) || 0;
        const stokAkhir = stok_akhir !== undefined && stok_akhir !== '' ? parseFloat(stok_akhir) : stokAwal;
        const result = await bahanService.update(
            id, kode_bahan, nama_bahan, produsen || '-',
            stokAwal, stokAkhir,
            satuan || 'gram', tanggal_kadaluarsa || null,
            lab_id || 1, keterangan || ''
        );
        if (result.affectedRows === 0) return error(res, 'Bahan tidak ditemukan', 404);
        return success(res, null, 'Data bahan berhasil diperbarui');
    } catch (err) {
        console.error('Error updating bahan:', err);
        return error(res, 'Gagal memperbarui bahan');
    }
}

async function remove(req, res) {
    const { id } = req.params;
    try {
        const result = await bahanService.remove(id);
        if (result.affectedRows === 0) return error(res, 'Bahan tidak ditemukan', 404);
        return success(res, null, 'Data bahan berhasil dihapus');
    } catch (err) {
        console.error('Error menghapus bahan:', err);
        return error(res, 'Gagal menghapus data bahan');
    }
}

async function pakai(req, res) {
    const { bahan_id, jumlah_digunakan, penanggung_jawab, kelas, kegiatan, tanggal } = req.body;
    if (!bahan_id || !jumlah_digunakan || !penanggung_jawab || !kegiatan || !tanggal) {
        return error(res, 'Kolom wajib diisi', 400);
    }
    try {
        const bahan = await bahanService.getStokById(bahan_id);
        if (!bahan) return error(res, 'Bahan tidak ditemukan', 404);
        if (bahan.stok_akhir < parseFloat(jumlah_digunakan)) {
            return error(res, 'Stok tidak mencukupi', 400);
        }
        await bahanService.catatPenggunaan(
            bahan_id, parseFloat(jumlah_digunakan), penanggung_jawab,
            kelas || '-', kegiatan, tanggal
        );
        await bahanService.kurangiStok(bahan_id, parseFloat(jumlah_digunakan));
        return success(res, null, 'Data penggunaan berhasil dicatat, stok berkurang', 200);
    } catch (err) {
        console.error('Error penggunaan bahan:', err);
        return error(res, 'Gagal mencatat penggunaan bahan');
    }
}

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

async function hapusRiwayat(req, res) {
    const { id } = req.params;
    try {
        const result = await bahanService.hapusRiwayat(id);
        if (result.affectedRows === 0) return error(res, 'Riwayat tidak ditemukan', 404);
        return success(res, null, 'Riwayat berhasil dihapus (stok tidak berubah)');
    } catch (err) {
        console.error('Error deleting riwayat:', err);
        return error(res, 'Gagal menghapus riwayat');
    }
}

async function importExcel(req, res) {
    const filePath = req.file ? req.file.path : null;
    try {
        if (!req.file) return error(res, 'File Excel wajib diunggah', 400);
        const labId = parseInt(req.body.lab_id, 10);
        if (!labId || labId <= 0) return error(res, 'lab_id tidak valid', 400);

        const result = await bahanService.importFromExcel(labId, filePath);

        if (result.failed > 0) {
            return errorWithDetails(
                res,
                `Import dibatalkan: ${result.failed} baris bermasalah`,
                result,
                400
            );
        }
        return success(res, result, `Berhasil mengimpor ${result.inserted} baris bahan`, 201);
    } catch (err) {
        const status = err.status || 500;
        return error(res, err.message || 'Gagal mengimpor data bahan', status);
    } finally {
        if (filePath && fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (_) { /* ignore */ }
        }
    }
}

module.exports = { getAll, create, update, remove, pakai, getRiwayat, hapusRiwayat, importExcel };