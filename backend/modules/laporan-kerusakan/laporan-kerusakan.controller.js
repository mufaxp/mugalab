const laporanService = require('./laporan-kerusakan.service');
const { success, error } = require('../../shared/utils/response');

/**
 * GET semua laporan kerusakan (alat & sarana, filter lab)
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
 * Terima: { jenis, item_id / alat_id / sarana_id, jumlah_rusak, pelapor, tanggal_lapor, keterangan }
 */
async function create(req, res) {
    const { jumlah_rusak, pelapor, tanggal_lapor, keterangan } = req.body;
    const jenis = req.body.jenis || 'alat';

    // Terima dua format: item_id generik, atau alat_id/sarana_id spesifik
    let item_id = req.body.item_id;
    if (!item_id) {
        item_id = jenis === 'alat' ? req.body.alat_id : req.body.sarana_id;
    }

    if (!item_id || !jumlah_rusak || !pelapor || !tanggal_lapor) {
        return error(res, 'Field wajib diisi', 400);
    }
    if (!['alat', 'sarana'].includes(jenis)) {
        return error(res, 'Jenis harus "alat" atau "sarana"', 400);
    }

    try {
        const stok = await laporanService.getStokItem(jenis, item_id);
        if (!stok) {
            return error(res, `${jenis === 'alat' ? 'Alat' : 'Sarana'} tidak ditemukan`, 404);
        }
        if (stok.jumlah < parseInt(jumlah_rusak)) {
            return error(res, 'Jumlah tidak mencukupi', 400);
        }

        await laporanService.create(jenis, item_id, parseInt(jumlah_rusak), pelapor, tanggal_lapor, keterangan || '');
        await laporanService.kurangiStok(jenis, item_id, parseInt(jumlah_rusak));

        return success(res, null, `Laporan berhasil dibuat, stok ${jenis} berkurang`, 201);
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

    if (!status) return error(res, 'Status wajib diisi', 400);

    try {
        const laporan = await laporanService.getById(id);
        if (!laporan) return error(res, 'Laporan tidak ditemukan', 404);

        const oldStatus = laporan.status;
        const itemId = laporan.jenis === 'alat' ? laporan.alat_id : laporan.sarana_id;

        await laporanService.updateStatus(id, status);

        // Selesai: perbaikan berhasil → stok kembali
        if (status === 'selesai' && (oldStatus === 'rusak' || oldStatus === 'diperbaiki')) {
            await laporanService.kembalikanStok(laporan.jenis, itemId, laporan.jumlah_rusak);
        }

        // Dibuang: item fisik keluar dari inventaris
        // → jumlah tetap (sudah dikurangi saat lapor), tapi jumlah_rusak dikurangi
        if (status === 'dibuang' && (oldStatus === 'rusak' || oldStatus === 'diperbaiki')) {
            await laporanService.kurangiJumlahRusak(laporan.jenis, itemId, laporan.jumlah_rusak);
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
        if (!laporan) return error(res, 'Laporan tidak ditemukan', 404);

        // Koreksi stok jika masih rusak/diperbaiki
        if (laporan.status === 'rusak' || laporan.status === 'diperbaiki') {
            const itemId = laporan.jenis === 'alat' ? laporan.alat_id : laporan.sarana_id;
            await laporanService.kembalikanStok(laporan.jenis, itemId, laporan.jumlah_rusak);
        }

        await laporanService.remove(id);
        return success(res, null, 'Laporan berhasil dihapus');
    } catch (err) {
        console.error('Error deleting laporan:', err);
        return error(res, 'Gagal menghapus laporan');
    }
}

module.exports = { getAll, create, updateStatus, remove };