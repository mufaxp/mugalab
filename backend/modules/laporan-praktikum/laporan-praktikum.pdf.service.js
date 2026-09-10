const path = require('path');
const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const { exec } = require('child_process');
const pool = require('../../config/db');

async function generatePDF(laporanId) {
    // 1. Ambil data laporan
    const [laporanRows] = await pool.query('SELECT * FROM laporan_praktikum WHERE id = ?', [laporanId]);
    if (laporanRows.length === 0) throw new Error('Laporan tidak ditemukan');
    const laporan = laporanRows[0];

    // 2. Ambil data pengaturan (nama sekolah & lab)
    const [settingsRows] = await pool.query(
        "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('nama_sekolah','nama_lab')"
    );
    const settings = {};
    settingsRows.forEach(r => settings[r.setting_key] = r.setting_value);

    // 3. Pastikan folder template dan temp ada
    const templateDir = path.join(__dirname, '..', '..', 'uploads', 'templates');
    const tempDir = path.join(__dirname, '..', '..', 'uploads', 'temp');
    if (!fs.existsSync(templateDir)) fs.mkdirSync(templateDir, { recursive: true });
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    // 4. Load template DOCX
    const templatePath = path.join(templateDir, 'laprak-template.docx');
    if (!fs.existsSync(templatePath)) throw new Error('Template tidak tersedia');

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        nullGetter: () => '-'   // placeholder kosong diisi '-'
    });

    // 5. Siapkan data untuk placeholder
    const alatBahan = JSON.parse(laporan.daftar_alat_bahan || '{}');
    const daftarAlat = (alatBahan.alat || []).map(a => `${a.nama} (${a.kode}) — ${a.jumlah} ${a.satuan}`).join('\n');
    const daftarBahan = (alatBahan.bahan || []).map(b => `${b.nama} (${b.kode}) — ${b.jumlah} ${b.satuan}`).join('\n');

    const tgl = laporan.tanggal
        ? new Date(laporan.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        : '-';

    // Ambil nama ruang lab berdasarkan lab_id laporan
    let ruangLab = 'Laboratorium';
    try {
        const [labRows] = await pool.query('SELECT nama FROM lab WHERE id = ?', [laporan.lab_id]);
        if (labRows.length > 0) ruangLab = labRows[0].nama;
    } catch (e) {
        console.warn('Gagal ambil nama lab:', e.message);
    }

    const data = {
        NAMA_LAB: settings.nama_lab || 'Laboratorium IPA',
        NAMA_SEKOLAH: settings.nama_sekolah || 'SMA',
        MATA_PELAJARAN: laporan.mata_pelajaran || '-',
        JUDUL: laporan.judul_praktikum || '-',
        KELAS: laporan.kelas || '-',
        JUMLAH_KELOMPOK: laporan.jumlah_kelompok || '-',
        TANGGAL: tgl,
        TANGGAL_TTD: tgl,
        RUANG_LAB: ruangLab,
        JAM: `${laporan.jam_mulai}-${laporan.jam_selesai}`,
        GURU: laporan.guru_mapel || '-',
        TUJUAN: laporan.tujuan_praktikum || '-',
        DESKRIPSI: laporan.deskripsi_kegiatan || '-',
        ALAT: daftarAlat || '-',
        BAHAN: daftarBahan || '-',
    };

    doc.render(data);

    // 6. Simpan DOCX hasil
    const outputDocx = path.join(tempDir, `laporan-${laporanId}.docx`);
    const buffer = doc.getZip().generate({ type: 'nodebuffer' });
    fs.writeFileSync(outputDocx, buffer);

    // 7. Convert ke PDF dengan LibreOffice
    const outputPdf = outputDocx.replace('.docx', '.pdf');
    try {
        await new Promise((resolve, reject) => {
            exec(
                `libreoffice --headless --convert-to pdf --outdir ${path.dirname(outputPdf)} ${outputDocx}`,
                { timeout: 30000 },
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        if (!fs.existsSync(outputPdf)) {
            throw new Error('Konversi PDF gagal: file tidak ditemukan');
        }
    } finally {
        // Selalu hapus DOCX sementara
        if (fs.existsSync(outputDocx)) fs.unlinkSync(outputDocx);
    }

    return outputPdf;
}

module.exports = { generatePDF };