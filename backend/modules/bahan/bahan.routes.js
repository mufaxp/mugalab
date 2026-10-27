const express = require('express');
const router = express.Router();
const bahanController = require('./bahan.controller');
const verifyToken = require('../../shared/middleware/verifyToken');
const requireRole = require('../../shared/middleware/requireRole');
const { excelUpload } = require('../../shared/middleware/uploadExcel');

router.get('/', verifyToken, bahanController.getAll);

// Import Excel
router.post(
    '/import',
    verifyToken,
    requireRole('admin', 'laboran'),
    excelUpload('file'),
    bahanController.importExcel
);

router.post('/', verifyToken, requireRole('admin', 'laboran'), bahanController.create);
router.post('/pakai', verifyToken, requireRole('admin', 'laboran'), bahanController.pakai);
router.get('/pakai', verifyToken, bahanController.getRiwayat);
router.delete('/pakai/:id', verifyToken, requireRole('admin', 'laboran'), bahanController.hapusRiwayat);
router.put('/:id', verifyToken, requireRole('admin', 'laboran'), bahanController.update);
router.delete('/:id', verifyToken, requireRole('admin', 'laboran'), bahanController.remove);

module.exports = router;