const laporanPraktikumService = require('./laporan-praktikum.service');
const { success, error } = require('../../shared/utils/response');
const fs = require('fs');

/**
 * GET semua laporan praktikum (filter lab_id opsional)
 */
async function getAll(req, res) {
    const { lab_id } = req.query;

    try {
        const data = await laporanPraktikumService.getAll(lab_id || null);
        return success(res, data);
    } catch (err) {
        console.error('Error fetching laporan praktikum:', err);
        return error(res, 'Gagal mengambil laporan');
    }
}

/**
 * POST buat laporan praktikum baru
 */
async function create(req, res) {
    const {
        jadwal_id,
        kelas,
        jumlah_kelompok,
        mata_pelajaran,
        jam_mulai,
        jam_selesai,
        guru_mapel,
        judul_praktikum,
        tujuan_praktikum,
        daftar_alat_bahan,
        deskripsi_kegiatan,
        tanggal,
        lab_id
    } = req.body;

    try {
        const result = await laporanPraktikumService.create({
            jadwal_id: jadwal_id || null,
            kelas,
            jumlah_kelompok: parseInt(jumlah_kelompok) || 1,
            mata_pelajaran,
            jam_mulai: parseInt(jam_mulai) || null,
            jam_selesai: parseInt(jam_selesai) || null,
            guru_mapel,
            judul_praktikum,
            tujuan_praktikum,
            daftar_alat_bahan,
            deskripsi_kegiatan,
            tanggal,
            lab_id: lab_id || 1
        });

        return success(res, { id: result.insertId }, 'Laporan berhasil dibuat', 201);
    } catch (err) {
        console.error('Error creating laporan praktikum:', err);
        return error(res, 'Gagal membuat laporan');
    }
}

/**
 * PUT edit laporan praktikum
 */
async function update(req, res) {
    const { id } = req.params;
    const {
        kelas,
        jumlah_kelompok,
        mata_pelajaran,
        jam_mulai,
        jam_selesai,
        guru_mapel,
        judul_praktikum,
        tujuan_praktikum,
        daftar_alat_bahan,
        deskripsi_kegiatan,
        tanggal,
        lab_id
    } = req.body;

    try {
        const result = await laporanPraktikumService.update(id, {
            kelas,
            jumlah_kelompok: parseInt(jumlah_kelompok) || 1,
            mata_pelajaran,
            jam_mulai: parseInt(jam_mulai) || null,
            jam_selesai: parseInt(jam_selesai) || null,
            guru_mapel,
            judul_praktikum,
            tujuan_praktikum,
            daftar_alat_bahan,
            deskripsi_kegiatan,
            tanggal,
            lab_id: lab_id || 1
        });

        if (result.affectedRows === 0) {
            return error(res, 'Laporan tidak ditemukan', 404);
        }
        return success(res, null, 'Laporan berhasil diperbarui');
    } catch (err) {
        console.error('Error updating laporan praktikum:', err);
        return error(res, 'Gagal memperbarui laporan');
    }
}

/**
 * DELETE hapus laporan praktikum
 */
async function remove(req, res) {
    const { id } = req.params;

    try {
        const result = await laporanPraktikumService.remove(id);
        if (result.affectedRows === 0) {
            return error(res, 'Laporan tidak ditemukan', 404);
        }
        return success(res, null, 'Laporan berhasil dihapus');
    } catch (err) {
        console.error('Error deleting laporan praktikum:', err);
        return error(res, 'Gagal menghapus laporan');
    }
}

const pdfService = require('./laporan-praktikum.pdf.service');

async function downloadPDF(req, res) {
    const { id } = req.params;
    try {
        const pdfPath = await pdfService.generatePDF(id);
        res.download(pdfPath, `Laporan_Praktikum_${id}.pdf`, (err) => {
            if (err) console.error('Error download:', err);
            // hapus file setelah dikirim (opsional)
            fs.unlinkSync(pdfPath);
        });
    } catch (err) {
        console.error('Error generating PDF:', err);
        return error(res, 'Gagal membuat PDF: ' + err.message);
    }
}

module.exports = { getAll, create, update, remove, downloadPDF };