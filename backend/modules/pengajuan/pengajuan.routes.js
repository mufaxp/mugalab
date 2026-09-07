const express = require('express');
const router = express.Router();
const pengajuanController = require('./pengajuan.controller');
const verifyToken = require('../../shared/middleware/verifyToken');
const requireRole = require('../../shared/middleware/requireRole');

// GET semua pengajuan (admin/laboran)
router.get('/', verifyToken, pengajuanController.getAll);

// POST pengajuan baru (publik/chatbot)
router.post('/', pengajuanController.create);

// PUT proses pengajuan (admin/laboran)
router.put('/:id', verifyToken, requireRole('admin', 'laboran'), pengajuanController.update);

module.exports = router;