const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'templates');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        cb(null, 'laprak-template.docx'); // selalu overwrite
    }
});

const fileFilter = (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.docx') {
        cb(null, true);
    } else {
        cb(new Error('Hanya file .docx yang diperbolehkan'), false);
    }
};

module.exports = multer({ storage, fileFilter });