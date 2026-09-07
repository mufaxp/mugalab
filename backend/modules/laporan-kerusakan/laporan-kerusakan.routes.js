const express = require('express');
const router = express.Router();
const laporanController = require('./laporan-kerusakan.controller');
const verifyToken = require('../../shared/middleware/verifyToken');
const requireRole = require('../../shared/middleware/requireRole');

// GET semua laporan
router.get('/', verifyToken, laporanController.getAll);

// POST buat laporan baru (admin/laboran)
router.post('/', verifyToken, requireRole('admin', 'laboran'), laporanController.create);

// PUT update status laporan (admin/laboran)
router.put('/:id', verifyToken, requireRole('admin', 'laboran'), laporanController.updateStatus);

// DELETE hapus laporan (admin/laboran)
router.delete('/:id', verifyToken, requireRole('admin', 'laboran'), laporanController.remove);

module.exports = router;