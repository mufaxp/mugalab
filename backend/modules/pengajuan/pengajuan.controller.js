const pengajuanService = require('./pengajuan.service');
const { success, error } = require('../../shared/utils/response');
const { sendWANotificationToAdmin, sendWANotificationToGuru } = require('../../shared/utils/whatsapp');

/**
 * GET semua pengajuan jadwal
 */
async function getAll(req, res) {
    try {
        const data = await pengajuanService.getAll();
        return success(res, data);
    } catch (err) {
        console.error('Error fetching pengajuan:', err);
        return error(res, 'Gagal mengambil data pengajuan');
    }
}

/**
 * POST pengajuan jadwal baru
 */
async function create(req, res) {
    const {
        pengaju,
        nomor_wa,
        penanggung_jawab,
        mata_pelajaran,
        kegiatan,
        kelas,
        tanggal,
        jam_mulai,
        jam_selesai,
        lab_id
    } = req.body;

    // Validasi field wajib
    if (!penanggung_jawab || !kegiatan || !tanggal) {
        return error(res, 'Data tidak lengkap', 400);
    }

    try {
        const result = await pengajuanService.create({
            pengaju: pengaju || '',
            nomor_wa: nomor_wa || '',
            penanggung_jawab,
            mata_pelajaran: mata_pelajaran || '',
            kegiatan,
            kelas: kelas || '-',
            tanggal,
            jam_mulai: parseInt(jam_mulai) || 0,
            jam_selesai: parseInt(jam_selesai) || 0,
            lab_id: lab_id || 1
        });

        // Kirim notifikasi ke admin
        const notifMsg =
            `📩 *Pengajuan Jadwal Baru*\n\n` +
            `Pemohon: ${pengaju || '-'}\n` +
            `Nomor WA: ${nomor_wa || '-'}\n` +
            `Kegiatan: ${kegiatan}\n` +
            `PJ: ${penanggung_jawab}\n` +
            `Mapel: ${mata_pelajaran || '-'}\n` +
            `Tanggal: ${tanggal}\n` +
            `Jam: ${jam_mulai}-${jam_selesai}\n\n` +
            `Segera cek dashboard untuk terima/tolak.\n` +
            `🔗 https://lab.mugalearning.web.id/dashboard`;

        sendWANotificationToAdmin(notifMsg);

        return success(res, { id: result.insertId }, 'Pengajuan berhasil dikirim', 201);
    } catch (err) {
        console.error('Error pengajuan:', err);
        return error(res, 'Gagal menyimpan pengajuan');
    }
}

/**
 * PUT proses pengajuan (terima/tolak)
 */
async function update(req, res) {
    const { id } = req.params;
    const { status, alasan_tolak } = req.body;

    if (!status || !['diterima', 'ditolak'].includes(status)) {
        return error(res, 'Status tidak valid', 400);
    }

    try {
        const pengajuan = await pengajuanService.getById(id);
        if (!pengajuan) {
            return error(res, 'Pengajuan tidak ditemukan', 404);
        }

        // Jika diterima, masukkan ke tabel jadwal
        if (status === 'diterima') {
            await pengajuanService.insertJadwal(pengajuan);
        }

        // Update status pengajuan
        await pengajuanService.updateStatus(id, status, alasan_tolak || '', req.user.nama || 'Unknown');

        // Kirim notifikasi ke guru via WhatsApp
        const guruMsg = status === 'diterima'
            ? `✅ *Pengajuan Jadwal DITERIMA*\n\n` +
              `Kegiatan: ${pengajuan.kegiatan}\n` +
              `Mata Pelajaran: ${pengajuan.mata_pelajaran || '-'}\n` +
              `Tanggal: ${pengajuan.tanggal}\n` +
              `Jam: ${pengajuan.jam_mulai}-${pengajuan.jam_selesai}\n\n` +
              `Silakan cek jadwal di:\n🔗 https://lab.mugalearning.web.id`
            : `❌ *Pengajuan Jadwal DITOLAK*\n\n` +
              `Kegiatan: ${pengajuan.kegiatan}\n` +
              `Alasan: ${alasan_tolak || 'Tidak disebutkan'}`;

        await sendWANotificationToGuru(pengajuan.nomor_wa, guruMsg);

        return success(res, null, `Pengajuan ${status}`);
    } catch (err) {
        console.error('Error proses pengajuan:', err);
        return error(res, 'Gagal memproses pengajuan');
    }
}

module.exports = { getAll, create, update };