/**
 * Generate template Excel untuk import inventaris.
 * Jalankan sekali: node backend/scripts/generate-templates.js
 * Output: frontend/dashboard/assets/templates/*.xlsx
 */
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const outDir = path.join(__dirname, '../../frontend/dashboard/assets/templates');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function make(name, headers, sample) {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sample]);
    ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 4, 18) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, path.join(outDir, name));
    console.log('✅', name);
}

// Template Alat (tanpa kondisi & jumlah_rusak sesuai permintaan)
make('alat-template.xlsx',
    ['kode_alat', 'nama_alat', 'spek', 'produsen', 'jumlah', 'keterangan'],
    [
        ['ALT-001', 'Gelas Ukur', '100 ml kaca', 'Pyrex', 10, 'Rak A'],
        ['ALT-002', 'Tabung Reaksi', 'Pyrex 16x150mm', 'Pyrex', 20, 'Rak B'],
        ['ALT-003', 'Mikroskop Binokuler', 'Perbesaran 400x', 'Olympus', 5, 'Lemari Kaca']
    ]);

// Template Sarana
make('sarana-template.xlsx',
    ['kode_sarana', 'nama_sarana', 'spek', 'produsen', 'jumlah', 'keterangan'],
    [
        ['SRN-001', 'Meja Praktikum', 'Kayu 120x60cm', 'Lokal', 8, 'Lab Kimia'],
        ['SRN-002', 'Kursi Lipat', 'Besi', 'Lokal', 20, 'Gudang']
    ]);

// Template Bahan — 5 contoh data, satu per satuan (gram, ml, liter, kg, buah)
make('bahan-template.xlsx',
    ['kode_bahan', 'nama_bahan', 'produsen', 'stok_awal', 'stok_akhir', 'satuan', 'tanggal_kadaluarsa', 'keterangan'],
    [
        ['BHN-001', 'Asam Sulfat', 'Merck', 100.00, 100.00, 'gram',  '2026-12-31', 'H2SO4 pekat'],
        ['BHN-002', 'NaOH 0.1 M', 'Merck', 500.00, 500.00, 'ml',    '2027-06-30', 'Larutan standar'],
        ['BHN-003', 'Aquades', 'Lokal',     5.00,   5.00, 'liter', '',           'Air murni'],
        ['BHN-004', 'Gula Pasir', 'Gulaku',  2.00,   2.00, 'kg',    '2027-01-31', 'Praktikum enzim'],
        ['BHN-005', 'Kertas Lakmus', '-',  100.00, 100.00, 'buah',  '',           'Indikator pH']
    ]);

console.log('Done. Templates written to:', outDir);