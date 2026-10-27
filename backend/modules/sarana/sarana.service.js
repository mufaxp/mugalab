const pool = require('../../config/db');
const XLSX = require('xlsx');

const MAX_ROWS = 1000;

async function getAll(labId = null) {
    let query = `
        SELECT s.*,
            COALESCE((
                SELECT SUM(p.jumlah)
                FROM peminjaman p
                WHERE p.sarana_id = s.id AND p.status = 'dipinjam'
            ), 0) AS dipinjam
        FROM sarana s
    `;
    const params = [];
    if (labId) {
        query += ' WHERE s.lab_id = ?';
        params.push(labId);
    }
    query += ' ORDER BY s.kode_sarana';
    const [rows] = await pool.query(query, params);
    return rows;
}

async function create(kode_sarana, nama_sarana, spek, produsen, jumlah, lab_id, keterangan) {
    const [result] = await pool.query(
        'INSERT INTO sarana (kode_sarana, nama_sarana, spek, produsen, jumlah, lab_id, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [kode_sarana, nama_sarana, spek, produsen, jumlah, lab_id, keterangan]
    );
    return result;
}

async function update(id, kode_sarana, nama_sarana, spek, produsen, jumlah, jumlah_rusak, kondisi, lab_id, keterangan) {
    const [result] = await pool.query(
        'UPDATE sarana SET kode_sarana=?, nama_sarana=?, spek=?, produsen=?, jumlah=?, jumlah_rusak=?, kondisi=?, lab_id=?, keterangan=? WHERE id=?',
        [kode_sarana, nama_sarana, spek, produsen, jumlah, jumlah_rusak, kondisi, lab_id, keterangan, id]
    );
    return result;
}

async function remove(id) {
    const [result] = await pool.query('DELETE FROM sarana WHERE id=?', [id]);
    return result;
}

// Bulk import sarana dari Excel.
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
    const required = ['kode_sarana', 'nama_sarana', 'jumlah'];
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
        const kode = String(row.kode_sarana ?? '').trim();
        const nama = String(row.nama_sarana ?? '').trim();
        const spek = String(row.spek ?? '').trim() || '-';
        const produsen = String(row.produsen ?? '').trim() || '-';
        const jumlah = toInt(row.jumlah);
        const keterangan = String(row.keterangan ?? '').trim();

        if (!kode) {
            errors.push({ row: rowNum, column: 'kode_sarana', value: '', message: 'Kode sarana wajib diisi' });
            return;
        }
        if (kode.length > 20) {
            errors.push({ row: rowNum, column: 'kode_sarana', value: kode, message: 'Kode sarana maksimal 20 karakter' });
            return;
        }
        if (!nama) {
            errors.push({ row: rowNum, column: 'nama_sarana', value: '', message: 'Nama sarana wajib diisi' });
            return;
        }
        if (nama.length > 150) {
            errors.push({ row: rowNum, column: 'nama_sarana', value: nama, message: 'Nama sarana maksimal 150 karakter' });
            return;
        }
        if (jumlah === null || jumlah < 0) {
            errors.push({ row: rowNum, column: 'jumlah', value: String(row.jumlah ?? ''), message: 'Jumlah harus bilangan bulat ≥ 0' });
            return;
        }
        if (seenKode.has(kode)) {
            errors.push({ row: rowNum, column: 'kode_sarana', value: kode, message: `Duplikat dengan baris ${seenKode.get(kode)}` });
            return;
        }
        seenKode.set(kode, rowNum);
        validRows.push({ kode, nama, spek, produsen, jumlah, keterangan, row: rowNum });
    });

    if (validRows.length > 0) {
        const kodes = validRows.map(r => r.kode);
        const placeholders = kodes.map(() => '?').join(',');
        const [existingRows] = await pool.query(
            `SELECT kode_sarana FROM sarana WHERE kode_sarana IN (${placeholders})`,
            kodes
        );
        const existing = new Set(existingRows.map(r => r.kode_sarana));
        validRows.forEach(r => {
            if (existing.has(r.kode)) {
                errors.push({ row: r.row, column: 'kode_sarana', value: r.kode, message: 'Kode sarana sudah ada di database' });
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
            const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(',');
            const values = chunk.flatMap(r => [r.kode, r.nama, r.spek, r.produsen, r.jumlah, labId, r.keterangan]);
            await conn.query(
                `INSERT INTO sarana (kode_sarana, nama_sarana, spek, produsen, jumlah, lab_id, keterangan) VALUES ${placeholders}`,
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