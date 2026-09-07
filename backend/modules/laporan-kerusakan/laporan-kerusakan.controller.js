const laporanService = require('./laporan-kerusakan.service');
const { success, error } = require('../../shared/utils/response');

/**
 * GET semua laporan kerusakan (join alat, filter lab)
 */
async function getAll(req, res) {
    const { lab_id } = req.query;

    try {
        const data = await laporanService.getAll(lab_id || null);
        return success(res, data);
    } catch (err) {
        console.error('Error fetching laporan:', err);
        return error(res, 'Gagal mengambil data laporan');
    }
}

/**
 * POST buat laporan kerusakan baru
 */
async function create(req, res) {
    const { alat_id, jumlah_rusak, pelapor, tanggal_lapor, keterangan } = req.body;

    // Validasi
    if (!alat_id || !jumlah_rusak || !pelapor || !tanggal_lapor) {
        return error(res, 'Field wajib diisi', 400);
    }

    try {
        // Cek stok alat
        const alat = await laporanService.getAlatStok(alat_id);
        if (!alat) {
            return error(res, 'Alat tidak ditemukan', 404);
        }

        if (alat.jumlah < parseInt(jumlah_rusak)) {
            return error(res, 'Jumlah alat tidak mencukupi', 400);
        }

        // Insert laporan
        await laporanService.create(
            alat_id,
            parseInt(jumlah_rusak),
            pelapor,
            tanggal_lapor,
            keterangan || ''
        );

        // Kurangi stok alat & tambah jumlah rusak
        await laporanService.kurangiStokAlat(alat_id, parseInt(jumlah_rusak));

        return success(res, null, 'Laporan berhasil dibuat, stok alat berkurang', 201);
    } catch (err) {
        console.error('Error creating laporan:', err);
        return error(res, 'Gagal membuat laporan');
    }
}

/**
 * PUT update status laporan
 */
async function updateStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return error(res, 'Status wajib diisi', 400);
    }

    try {
        // Ambil data laporan
        const laporan = await laporanService.getById(id);
        if (!laporan) {
            return error(res, 'Laporan tidak ditemukan', 404);
        }

        const oldStatus = laporan.status;

        // Update status
        await laporanService.updateStatus(id, status);

        // Logika stok
        if (status === 'selesai' && (oldStatus === 'rusak' || oldStatus === 'diperbaiki')) {
            // Kembalikan stok
            await laporanService.kembalikanStokAlat(laporan.alat_id, laporan.jumlah_rusak);
        }

        return success(res, null, 'Status berhasil diperbarui');
    } catch (err) {
        console.error('Error updating laporan:', err);
        return error(res, 'Gagal memperbarui status');
    }
}

/**
 * DELETE hapus laporan
 */
async function remove(req, res) {
    const { id } = req.params;

    try {
        const laporan = await laporanService.getById(id);
        if (!laporan) {
            return error(res, 'Laporan tidak ditemukan', 404);
        }

        // Jika status masih rusak/diperbaiki, kembalikan stok (koreksi)
        if (laporan.status === 'rusak' || laporan.status === 'diperbaiki') {
            await laporanService.kembalikanStokAlat(laporan.alat_id, laporan.jumlah_rusak);
        }

        await laporanService.remove(id);
        return success(res, null, 'Laporan berhasil dihapus');
    } catch (err) {
        console.error('Error deleting laporan:', err);
        return error(res, 'Gagal menghapus laporan');
    }
}

module.exports = { getAll, create, updateStatus, remove };