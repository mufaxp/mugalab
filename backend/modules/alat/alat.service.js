const pool = require('../../config/db');
const XLSX = require('xlsx');

const MAX_ROWS = 1000;

/**
 * Ambil semua alat, optional filter lab_id.
 */
async function getAll(labId = null) {
    let query = `
        SELECT a.*,
            COALESCE((
                SELECT SUM(p.jumlah)
                FROM peminjaman p
                WHERE p.alat_id = a.id AND p.status = 'dipinjam'
            ), 0) AS dipinjam
        FROM alat a
    `;
    const params = [];

    if (labId) {
        query += ' WHERE a.lab_id = ?';
        params.push(labId);
    }

    query += ' ORDER BY a.kode_alat';
    const [rows] = await pool.query(query, params);
    return rows;
}

/**
 * Tambah alat
 */
async function create(kode_alat, nama_alat, spek, produsen, jumlah, lab_id, keterangan) {
    const [result] = await pool.query(
        'INSERT INTO alat (kode_alat, nama_alat, spek, produsen, jumlah, lab_id, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [kode_alat, nama_alat, spek, produsen, jumlah, lab_id, keterangan]
    );
    return result;
}

/**
 * Update alat
 */
async function update(id, kode_alat, nama_alat, spek, produsen, jumlah, jumlah_rusak, kondisi, lab_id, keterangan) {
    const [result] = await pool.query(
        'UPDATE alat SET kode_alat=?, nama_alat=?, spek=?, produsen=?, jumlah=?, jumlah_rusak=?, kondisi=?, lab_id=?, keterangan=? WHERE id=?',
        [kode_alat, nama_alat, spek, produsen, jumlah, jumlah_rusak, kondisi, lab_id, keterangan, id]
    );
    return result;
}

/**
 * Hapus alat
 */
async function remove(id) {
    const [result] = await pool.query('DELETE FROM alat WHERE id=?', [id]);
    return result;
}

/**
 * Bulk import alat dari file Excel.
 * Return: { inserted, failed, errors: [{ row, column, value, message }] }
 * - Atomic: jika ada error validasi → tidak ada data yang di-insert.
 */
async function importFromExcel(labId, filePath) {
    // 1. Cek lab
    const [labRows] = await pool.query('SELECT id FROM lab WHERE id = ?', [labId]);
    if (labRows.length === 0) {
        const err = new Error('Lab tidak ditemukan');
        err.status = 404;
        throw err;
    }

    // 2. Baca Excel
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

    // 3. Cek header
    const headers = Object.keys(raw[0]).map(h => String(h).trim().toLowerCase());
    const required = ['kode_alat', 'nama_alat', 'jumlah'];
    const missing = required.filter(h => !headers.includes(h));
    if (missing.length > 0) {
        const err = new Error(
            `Kolom wajib tidak ditemukan di header: ${missing.join(', ')}. ` +
            `Pastikan baris pertama berisi header: ${required.join(', ')}`
        );
        err.status = 400;
        throw err;
    }

    // 4. Validasi per baris
    const errors = [];
    const validRows = [];
    const seenKode = new Map();

    raw.forEach((row, i) => {
        const rowNum = i + 2; // header = baris 1
        const kode = String(row.kode_alat ?? '').trim();
        const nama = String(row.nama_alat ?? '').trim();
        const spek = String(row.spek ?? '').trim() || '-';
        const produsen = String(row.produsen ?? '').trim() || '-';
        const jumlah = toInt(row.jumlah);
        const keterangan = String(row.keterangan ?? '').trim();

        if (!kode) {
            errors.push({ row: rowNum, column: 'kode_alat', value: '', message: 'Kode alat wajib diisi' });
            return;
        }
        if (kode.length > 20) {
            errors.push({ row: rowNum, column: 'kode_alat', value: kode, message: 'Kode alat maksimal 20 karakter' });
            return;
        }
        if (!nama) {
            errors.push({ row: rowNum, column: 'nama_alat', value: '', message: 'Nama alat wajib diisi' });
            return;
        }
        if (nama.length > 150) {
            errors.push({ row: rowNum, column: 'nama_alat', value: nama, message: 'Nama alat maksimal 150 karakter' });
            return;
        }
        if (jumlah === null || jumlah < 0) {
            errors.push({ row: rowNum, column: 'jumlah', value: String(row.jumlah ?? ''), message: 'Jumlah harus bilangan bulat ≥ 0' });
            return;
        }
        if (seenKode.has(kode)) {
            errors.push({ row: rowNum, column: 'kode_alat', value: kode, message: `Duplikat dengan baris ${seenKode.get(kode)}` });
            return;
        }
        seenKode.set(kode, rowNum);
        validRows.push({ kode, nama, spek, produsen, jumlah, keterangan, row: rowNum });
    });

    // 5. Pre-check duplikat di DB
    if (validRows.length > 0) {
        const kodes = validRows.map(r => r.kode);
        const placeholders = kodes.map(() => '?').join(',');
        const [existingRows] = await pool.query(
            `SELECT kode_alat FROM alat WHERE kode_alat IN (${placeholders})`,
            kodes
        );
        const existing = new Set(existingRows.map(r => r.kode_alat));
        validRows.forEach(r => {
            if (existing.has(r.kode)) {
                errors.push({ row: r.row, column: 'kode_alat', value: r.kode, message: 'Kode alat sudah ada di database' });
            }
        });
    }

    errors.sort((a, b) => a.row - b.row);

    if (errors.length > 0) {
        return { inserted: 0, failed: errors.length, errors };
    }

    // 6. Insert dalam transaksi (bulk per chunk)
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const chunkSize = 100;
        for (let i = 0; i < validRows.length; i += chunkSize) {
            const chunk = validRows.slice(i, i + chunkSize);
            const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(',');
            const values = chunk.flatMap(r => [r.kode, r.nama, r.spek, r.produsen, r.jumlah, labId, r.keterangan]);
            await conn.query(
                `INSERT INTO alat (kode_alat, nama_alat, spek, produsen, jumlah, lab_id, keterangan) VALUES ${placeholders}`,
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

function toInt(v) {
    if (v === null || v === undefined || v === '') return null;
    const s = String(v).trim().replace(',', '.');
    const n = Number(s);
    if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
    return n;
}

module.exports = { getAll, create, update, remove, importFromExcel };