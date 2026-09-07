const express = require('express');
const router = express.Router();
const jadwalController = require('./jadwal.controller');
const verifyToken = require('../../shared/middleware/verifyToken');
const requireRole = require('../../shared/middleware/requireRole');

// GET jadwal publik
router.get('/public', jadwalController.getPublic);

// GET jadwal dashboard (auth)
router.get('/', verifyToken, jadwalController.getAll);

// POST tambah jadwal (admin/laboran)
router.post('/', verifyToken, requireRole('admin', 'laboran'), jadwalController.create);

// PUT edit jadwal (admin/laboran)
router.put('/:id', verifyToken, requireRole('admin', 'laboran'), jadwalController.update);

// DELETE hapus jadwal (admin/laboran)
router.delete('/:id', verifyToken, requireRole('admin', 'laboran'), jadwalController.remove);

module.exports = router;