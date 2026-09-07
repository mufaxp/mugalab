const express = require('express');
const router = express.Router();
const bahanController = require('./bahan.controller');
const verifyToken = require('../../shared/middleware/verifyToken');
const requireRole = require('../../shared/middleware/requireRole');

// GET semua bahan
router.get('/', verifyToken, bahanController.getAll);

// POST tambah bahan (admin/laboran)
router.post('/', verifyToken, requireRole('admin', 'laboran'), bahanController.create);

// POST penggunaan bahan (admin/laboran)
router.post('/pakai', verifyToken, requireRole('admin', 'laboran'), bahanController.pakai);

// GET riwayat penggunaan bahan
router.get('/pakai', verifyToken, bahanController.getRiwayat);

// DELETE riwayat penggunaan
router.delete('/pakai/:id', verifyToken, requireRole('admin', 'laboran'), bahanController.hapusRiwayat);

// PUT edit bahan (admin/laboran)
router.put('/:id', verifyToken, requireRole('admin', 'laboran'), bahanController.update);

// DELETE hapus bahan (admin/laboran)
router.delete('/:id', verifyToken, requireRole('admin', 'laboran'), bahanController.remove);

module.exports = router;