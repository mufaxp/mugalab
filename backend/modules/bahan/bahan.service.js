const pool = require('../../config/db');
const XLSX = require('xlsx');

const MAX_ROWS = 1000;
const ALLOWED_SATUAN = ['gram', 'ml', 'liter', 'kg', 'buah'];

async function getAll(labId = null) {
    let query = 'SELECT * FROM bahan';
    const params = [];
    if (labId) {
        query += ' WHERE lab_id = ?';
        params.push(labId);
    }
    query += ' ORDER BY kode_bahan';
    const [rows] = await pool.query(query, params);
    return rows;
}

async function create(kode_bahan, nama_bahan, produsen, stok_awal, stok_akhir, satuan, tanggal_kadaluarsa, lab_id, keterangan) {
    const [result] = await pool.query(
        'INSERT INTO bahan (kode_bahan, nama_bahan, produsen, stok_awal, stok_akhir, satuan, tanggal_kadaluarsa, lab_id, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [kode_bahan, nama_bahan, produsen, stok_awal, stok_akhir, satuan, tanggal_kadaluarsa, lab_id, keterangan]
    );
    return result;
}

async function update(id, kode_bahan, nama_bahan, produsen, stok_awal, stok_akhir, satuan, tanggal_kadaluarsa, lab_id, keterangan) {
    const [result] = await pool.query(
        'UPDATE bahan SET kode_bahan=?, nama_bahan=?, produsen=?, stok_awal=?, stok_akhir=?, satuan=?, tanggal_kadaluarsa=?, lab_id=?, keterangan=? WHERE id=?',
        [kode_bahan, nama_bahan, produsen, stok_awal, stok_akhir, satuan, tanggal_kadaluarsa, lab_id, keterangan, id]
    );
    return result;
}

async function remove(id) {
    const [result] = await pool.query('DELETE FROM bahan WHERE id=?', [id]);
    return result;
}

async function getStokById(id) {
    const [rows] = await pool.query('SELECT stok_akhir FROM bahan WHERE id=?', [id]);
    return rows[0] || null;
}

async function kurangiStok(id, jumlah) {
    await pool.query('UPDATE bahan SET stok_akhir = stok_akhir - ? WHERE id = ?', [jumlah, id]);
}

async function catatPenggunaan(bahan_id, jumlah_digunakan, penanggung_jawab, kelas, kegiatan, tanggal) {
    await pool.query(
        'INSERT INTO penggunaan_bahan (bahan_id, jumlah_digunakan, penanggung_jawab, kelas, kegiatan, tanggal) VALUES (?, ?, ?, ?, ?, ?)',
        [bahan_id, jumlah_digunakan, penanggung_jawab, kelas, kegiatan, tanggal]
    );
}

async function getRiwayat(bahanId = null, labId = null) {
    let query = `SELECT pb.*, b.nama_bahan, b.satuan, b.lab_id 
                 FROM penggunaan_bahan pb 
                 JOIN bahan b ON pb.bahan_id = b.id`;
    const params = [];
    const conditions = [];
    if (bahanId) {
        conditions.push('pb.bahan_id = ?');
        params.push(bahanId);
    }
    if (labId) {
        conditions.push('b.lab_id = ?');
        params.push(labId);
    }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY pb.tanggal DESC, pb.created_at DESC LIMIT 100';
    const [rows] = await pool.query(query, params);
    return rows;
}

async function hapusRiwayat(id) {
    const [result] = await pool.query('DELETE FROM penggunaan_bahan WHERE id = ?', [id]);
    return result;
}

// Bulk import bahan dari Excel.
async function importFromExcel(labId, filePath) {
    const [labRows] = await pool.query('SELECT id FROM lab WHERE id = ?', [labId]);
    if (labRows.length === 0) {
        const err = new Error('Lab tidak ditemukan');
        err.status = 404;
        throw err;
    }

    let workbook;
    try {
        workbook = XLSX.readFile(filePath);
    } catch (e) {
        const err = new Error('File Excel tidak valid atau rusak');
        err.status = 400;
        throw err;
    }
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) {
        const err = new Error('File Excel tidak memiliki sheet');
        err.status = 400;
        throw err;
    }

    const raw = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: true });
    if (raw.length === 0) {
        const err = new Error('File Excel kosong (tidak ada baris data)');
        err.status = 400;
        throw err;
    }
    if (raw.length > MAX_ROWS) {
        const err = new Error(`Maksimal ${MAX_ROWS} baris per import`);
        err.status = 400;
        throw err;
    }

    const headers = Object.keys(raw[0]).map(h => String(h).trim().toLowerCase());
    const required = ['kode_bahan', 'nama_bahan', 'stok_awal'];
    const missing = required.filter(h => !headers.includes(h));
    if (missing.length > 0) {
        const err = new Error(
            `Kolom wajib tidak ditemukan di header: ${missing.join(', ')}. ` +
            `Pastikan baris pertama berisi header: ${required.join(', ')}`
        );
        err.status = 400;
        throw err;
    }

    const errors = [];
    const validRows = [];
    const seenKode = new Map();

    raw.forEach((row, i) => {
        const rowNum = i + 2;
        const kode = String(row.kode_bahan ?? '').trim();
        const nama = String(row.nama_bahan ?? '').trim();
        const produsen = String(row.produsen ?? '').trim() || '-';
        const stok_awal = toDecimal(row.stok_awal);
        const stok_akhir_raw = toDecimal(row.stok_akhir);
        const satuan = String(row.satuan ?? '').trim().toLowerCase() || 'gram';
        const tglKadaluarsa = parseDate(row.tanggal_kadaluarsa);
        const keterangan = String(row.keterangan ?? '').trim();

        if (!kode) {
            errors.push({ row: rowNum, column: 'kode_bahan', value: '', message: 'Kode bahan wajib diisi' });
            return;
        }
        if (kode.length > 20) {
            errors.push({ row: rowNum, column: 'kode_bahan', value: kode, message: 'Kode bahan maksimal 20 karakter' });
            return;
        }
        if (!nama) {
            errors.push({ row: rowNum, column: 'nama_bahan', value: '', message: 'Nama bahan wajib diisi' });
            return;
        }
        if (nama.length > 150) {
            errors.push({ row: rowNum, column: 'nama_bahan', value: nama, message: 'Nama bahan maksimal 150 karakter' });
            return;
        }
        if (stok_awal === null || stok_awal < 0) {
            errors.push({ row: rowNum, column: 'stok_awal', value: String(row.stok_awal ?? ''), message: 'Stok awal harus angka ≥ 0' });
            return;
        }
        if (row.stok_akhir != null && row.stok_akhir !== '' && (stok_akhir_raw === null || stok_akhir_raw < 0)) {
            errors.push({ row: rowNum, column: 'stok_akhir', value: String(row.stok_akhir ?? ''), message: 'Stok akhir harus angka ≥ 0' });
            return;
        }
        if (!ALLOWED_SATUAN.includes(satuan)) {
            errors.push({ row: rowNum, column: 'satuan', value: satuan, message: `Satuan harus salah satu dari: ${ALLOWED_SATUAN.join(', ')}` });
            return;
        }
        if (tglKadaluarsa === false) {
            errors.push({ row: rowNum, column: 'tanggal_kadaluarsa', value: String(row.tanggal_kadaluarsa ?? ''), message: 'Format tanggal harus YYYY-MM-DD atau DD/MM/YYYY' });
            return;
        }
        if (seenKode.has(kode)) {
            errors.push({ row: rowNum, column: 'kode_bahan', value: kode, message: `Duplikat dengan baris ${seenKode.get(kode)}` });
            return;
        }
        seenKode.set(kode, rowNum);

        const stok_akhir = (stok_akhir_raw === null || row.stok_akhir == null || row.stok_akhir === '')
            ? stok_awal : stok_akhir_raw;

        validRows.push({ kode, nama, produsen, stok_awal, stok_akhir, satuan, tglKadaluarsa, keterangan, row: rowNum });
    });

    if (validRows.length > 0) {
        const kodes = validRows.map(r => r.kode);
        const placeholders = kodes.map(() => '?').join(',');
        const [existingRows] = await pool.query(
            `SELECT kode_bahan FROM bahan WHERE kode_bahan IN (${placeholders})`,
            kodes
        );
        const existing = new Set(existingRows.map(r => r.kode_bahan));
        validRows.forEach(r => {
            if (existing.has(r.kode)) {
                errors.push({ row: r.row, column: 'kode_bahan', value: r.kode, message: 'Kode bahan sudah ada di database' });
            }
        });
    }

    errors.sort((a, b) => a.row - b.row);
    if (errors.length > 0) {
        return { inserted: 0, failed: errors.length, errors };
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const chunkSize = 100;
        for (let i = 0; i < validRows.length; i += chunkSize) {
            const chunk = validRows.slice(i, i + chunkSize);
            const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',');
            const values = chunk.flatMap(r => [
                r.kode, r.nama, r.produsen, r.stok_awal, r.stok_akhir, r.satuan, r.tglKadaluarsa, labId, r.keterangan
            ]);
            await conn.query(
                `INSERT INTO bahan (kode_bahan, nama_bahan, produsen, stok_awal, stok_akhir, satuan, tanggal_kadaluarsa, lab_id, keterangan) VALUES ${placeholders}`,
                values
            );
        }
        await conn.commit();
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }

    return { inserted: validRows.length, failed: 0, errors: [] };
}

function toDecimal(v) {
    if (v === null || v === undefined || v === '') return null;
    const s = String(v).trim().replace(',', '.');
    const n = Number(s);
    if (!Number.isFinite(n) || n < 0) return null;
    return n;
}

function parseDate(v) {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'number') {
        try {
            const d = XLSX.SSF.parse_date_code(v);
            if (!d) return false;
            return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
        } catch (e) {
            return false;
        }
    }
    const s = String(v).trim();
    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m) {
        return `${m[3]}-${String(m[2]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
    }
    return false;
}

module.exports = {
    getAll, create, update, remove,
    getStokById, kurangiStok, catatPenggunaan, getRiwayat, hapusRiwayat,
    importFromExcel
};