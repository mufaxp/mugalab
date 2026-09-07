const jadwalService = require('./jadwal.service');
const { success, error } = require('../../shared/utils/response');
const { sendWANotification } = require('../../shared/utils/whatsapp');

/**
 * GET jadwal publik (minggu_mulai, lab_id opsional)
 */
async function getPublic(req, res) {
    const { minggu_mulai, lab_id } = req.query;

    if (!minggu_mulai) {
        return error(res, 'Parameter minggu_mulai diperlukan', 400);
    }

    try {
        const data = await jadwalService.getJadwalMingguan(minggu_mulai, lab_id || null);
        return success(res, data);
    } catch (err) {
        console.error('Error fetching jadwal publik:', err);
        return error(res, 'Gagal mengambil data jadwal');
    }
}

/**
 * GET jadwal dashboard (auth, dengan has_laporan)
 */
async function getAll(req, res) {
    const { minggu_mulai, lab_id } = req.query;

    if (!minggu_mulai) {
        return error(res, 'Parameter minggu_mulai diperlukan', 400);
    }

    try {
        const data = await jadwalService.getJadwalMingguanWithLaporan(minggu_mulai, lab_id || null);
        return success(res, data);
    } catch (err) {
        console.error('Error fetching jadwal:', err);
        return error(res, 'Gagal mengambil data jadwal');
    }
}

/**
 * POST tambah jadwal
 */
async function create(req, res) {
    const { penanggung_jawab, kegiatan, kelas, tanggal, jam_mulai, jam_selesai, lab_id } = req.body;

    // Validasi
    if (!penanggung_jawab || !kegiatan || !tanggal || !jam_mulai || !jam_selesai) {
        return error(res, 'Semua field wajib diisi', 400);
    }
    if (jam_selesai < jam_mulai) {
        return error(res, 'Jam selesai harus lebih dari atau sama dengan jam mulai', 400);
    }

    try {
        const result = await jadwalService.create(penanggung_jawab, kegiatan, kelas || '-', tanggal, jam_mulai, jam_selesai, lab_id || 1);

        // Kirim notifikasi WA
        const notifData = { kegiatan, kelas: kelas || '-', penanggung_jawab, tanggal, jam_mulai, jam_selesai, lab_id: lab_id || 1 };
        sendWANotification(notifData, 'Baru');

        return success(res, { id: result.insertId }, 'Jadwal berhasil ditambahkan', 201);
    } catch (err) {
        console.error('Error menambahkan jadwal:', err);
        return error(res, 'Gagal menambahkan jadwal');
    }
}

/**
 * PUT edit jadwal
 */
async function update(req, res) {
    const { id } = req.params;
    const { penanggung_jawab, kegiatan, kelas, tanggal, jam_mulai, jam_selesai, lab_id } = req.body;

    if (!penanggung_jawab || !kegiatan || !tanggal || !jam_mulai || !jam_selesai) {
        return error(res, 'Semua field wajib diisi', 400);
    }
    if (jam_selesai < jam_mulai) {
        return error(res, 'Jam selesai harus lebih dari atau sama dengan jam mulai', 400);
    }

    try {
        const result = await jadwalService.update(id, penanggung_jawab, kegiatan, kelas || '-', tanggal, jam_mulai, jam_selesai, lab_id || 1);

        if (result.affectedRows === 0) {
            return error(res, 'Jadwal tidak ditemukan', 404);
        }

        // Kirim notifikasi WA
        const notifData = { kegiatan, kelas: kelas || '-', penanggung_jawab, tanggal, jam_mulai, jam_selesai, lab_id: lab_id || 1 };
        sendWANotification(notifData, 'Diperbarui');

        return success(res, null, 'Jadwal berhasil diperbarui');
    } catch (err) {
        console.error('Error memperbarui jadwal:', err);
        return error(res, 'Gagal mengupdate jadwal');
    }
}

/**
 * DELETE jadwal
 */
async function remove(req, res) {
    const { id } = req.params;

    try {
        const result = await jadwalService.remove(id);
        if (result.affectedRows === 0) {
            return error(res, 'Jadwal tidak ditemukan', 404);
        }
        return success(res, null, 'Jadwal berhasil dihapus');
    } catch (err) {
        console.error('Error hapus jadwal:', err);
        return error(res, 'Gagal menghapus jadwal');
    }
}

module.exports = { getPublic, getAll, create, update, remove };