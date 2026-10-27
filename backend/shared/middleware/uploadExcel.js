const multer = require('multer');
const path = require('path');
const fs = require('fs');

const TEMP_DIR = path.join(__dirname, '../../uploads/temp');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, TEMP_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const unique = `import-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') {
        cb(null, true);
    } else {
        cb(new Error('Hanya file Excel (.xlsx / .xls) yang diizinkan'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

// Wrapper multer agar error-nya dikembalikan sebagai JSON (bukan HTML page Express).
function excelUpload(fieldName = 'file') {
    return (req, res, next) => {
        upload.single(fieldName)(req, res, (err) => {
            if (err) {
                const msg = err.code === 'LIMIT_FILE_SIZE'
                    ? 'Ukuran file melebihi 5 MB'
                    : (err.message || 'Gagal mengunggah file');
                return res.status(400).json({ success: false, message: msg });
            }
            next();
        });
    };
}

module.exports = { excelUpload, upload };