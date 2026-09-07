const express = require('express');
const router = express.Router();
const peminjamanController = require('./peminjaman.controller');
const verifyToken = require('../../shared/middleware/verifyToken');
const requireRole = require('../../shared/middleware/requireRole');
const upload = require('../../shared/middleware/uploadPeminjaman');

// GET semua peminjaman (semua role yang login)
router.get('/', verifyToken, peminjamanController.getAll);

// POST pinjam (multipart)
router.post('/', verifyToken, upload.single('foto'), peminjamanController.pinjam);

// PUT pengembalian (multipart, admin/laboran)
router.put('/:id/kembali', verifyToken, requireRole('admin', 'laboran'), upload.single('foto'), peminjamanController.kembali);

module.exports = router;