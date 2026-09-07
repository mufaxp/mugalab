const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tentukan folder tujuan upload
const uploadDir = path.join(__dirname, '..', '..', '..', 'frontend', 'uploads', 'peminjaman');

// Buat folder jika belum ada
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi penyimpanan
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        // Nama file unik dengan ekstensi .webp
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + '.webp');
    }
});

// Filter jenis file (opsional)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('File harus berupa gambar'), false);
    }
};

// Middleware upload dengan batas ukuran 5MB
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter
});

module.exports = upload;