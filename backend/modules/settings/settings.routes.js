const express = require('express');
const router = express.Router();
const settingsController = require('./settings.controller');
const verifyToken = require('../../shared/middleware/verifyToken');
const requireRole = require('../../shared/middleware/requireRole');
const upload = require('../../shared/middleware/uploadTemplate');

// GET pengaturan publik (tanpa login)
router.get('/public', settingsController.getPublic);

// GET semua pengaturan (admin)
router.get('/', verifyToken, requireRole('admin'), settingsController.getAll);

// PUT update pengaturan (admin)
router.put('/', verifyToken, requireRole('admin'), settingsController.update);

// POST upload template DOCX (admin)
router.post('/template', verifyToken, requireRole('admin'), upload.single('file'), settingsController.uploadTemplate);

module.exports = router;