const peminjamanService = require('./peminjaman.service');
const { success, error } = require('../../shared/utils/response');

/**
 * GET semua peminjaman (filter status, jenis, lab_id)
 */
async function getAll(req, res) {
    const { status, jenis, lab_id } = req.query;

    try {
        const data = await peminjamanService.getAll({
            status: status || null,
            jenis: jenis || null,
            lab_id: lab_id || null
        });
        return success(res, data);
    } catch (err) {
        console.error('Error fetching peminjaman:', err);
        return error(res, 'Gagal mengambil data peminjaman');
    }
}

/**
 * POST pinjam barang (alat/sarana) dengan foto
 */
async function pinjam(req, res) {
    const {
        pemohon,
        jenis,
        alat_id,
        sarana_id,
        jumlah,
        kebutuhan,
        tanggal_pinjam,
        tanggal_kembali
    } = req.body;

    const foto_pinjam = req.file ? '/uploads/peminjaman/' + req.file.filename : null;
    const itemId = jenis === 'alat' ? alat_id : sarana_id;

    // Validasi
    if (!pemohon || !jenis || !itemId || !tanggal_pinjam || !tanggal_kembali) {
        return error(res, 'Field wajib diisi', 400);
    }

    try {
        // Cek stok barang
        const stok = await peminjamanService.getStokItem(jenis, itemId);
        if (!stok) {
            return error(res, 'Barang tidak ditemukan', 404);
        }
        if (stok.jumlah < (parseInt(jumlah) || 1)) {
            return error(res, 'Stok tidak mencukupi', 400);
        }

        // Simpan peminjaman
        await peminjamanService.createPeminjaman(
            pemohon,
            jenis,
            jenis === 'alat' ? itemId : null,
            jenis === 'sarana' ? itemId : null,
            parseInt(jumlah) || 1,
            kebutuhan || '',
            tanggal_pinjam,
            tanggal_kembali,
            foto_pinjam
        );

        // Kurangi stok
        await peminjamanService.kurangiStok(jenis, itemId, parseInt(jumlah) || 1);

        return success(res, null, 'Peminjaman berhasil dicatat', 201);
    } catch (err) {
        console.error('Error pinjam:', err);
        return error(res, 'Gagal mencatat peminjaman');
    }
}

/**
 * PUT pengembalian dengan foto + auto lapor kerusakan
 */
async function kembali(req, res) {
    const { id } = req.params;
    const { jumlah_rusak } = req.body;
    const foto_kembali = req.file ? '/uploads/peminjaman/' + req.file.filename : null;
    const rusak = parseInt(jumlah_rusak) || 0;

    try {
        // Ambil data peminjaman
        const peminjaman = await peminjamanService.getById(id);
        if (!peminjaman) {
            return error(res, 'Peminjaman tidak ditemukan', 404);
        }

        const today = new Date().toISOString().split('T')[0];

        // Update peminjaman
        await peminjamanService.updateKembali(id, today, foto_kembali);

        // Kembalikan stok (dikurangi rusak)
        const kembali = peminjaman.jumlah - rusak;

        if (peminjaman.jenis === 'alat') {
            await peminjamanService.kembalikanStok('alat', peminjaman.alat_id, kembali, rusak);

            // Auto lapor kerusakan jika ada rusak
            if (rusak > 0) {
                await peminjamanService.laporKerusakan('alat', peminjaman.alat_id, rusak, peminjaman.pemohon, today, '');
            }
        } else {
            await peminjamanService.kembalikanStok('sarana', peminjaman.sarana_id, kembali, rusak);
            // Sarana tidak punya laporan kerusakan otomatis
        }

        return success(res, null, 'Pengembalian berhasil');
    } catch (err) {
        console.error('Error pengembalian:', err);
        return error(res, 'Gagal memproses pengembalian');
    }
}

module.exports = { getAll, pinjam, kembali };