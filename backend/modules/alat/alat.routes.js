const express = require('express');
const router = express.Router();
const alatController = require('./alat.controller');
const verifyToken = require('../../shared/middleware/verifyToken');
const requireRole = require('../../shared/middleware/requireRole');

// GET daftar alat (semua role yang login)
router.get('/', verifyToken, alatController.getAll);

// POST tambah alat (admin/laboran)
router.post('/', verifyToken, requireRole('admin', 'laboran'), alatController.create);

// PUT edit alat (admin/laboran)
router.put('/:id', verifyToken, requireRole('admin', 'laboran'), alatController.update);

// DELETE hapus alat (admin/laboran)
router.delete('/:id', verifyToken, requireRole('admin', 'laboran'), alatController.remove);

module.exports = router;