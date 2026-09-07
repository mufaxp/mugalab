const express = require('express');
const router = express.Router();
const saranaController = require('./sarana.controller');
const verifyToken = require('../../shared/middleware/verifyToken');
const requireRole = require('../../shared/middleware/requireRole');

// GET daftar sarana
router.get('/', verifyToken, saranaController.getAll);

// POST tambah sarana (admin/laboran)
router.post('/', verifyToken, requireRole('admin', 'laboran'), saranaController.create);

// PUT edit sarana (admin/laboran)
router.put('/:id', verifyToken, requireRole('admin', 'laboran'), saranaController.update);

// DELETE hapus sarana (admin/laboran)
router.delete('/:id', verifyToken, requireRole('admin', 'laboran'), saranaController.remove);

module.exports = router;