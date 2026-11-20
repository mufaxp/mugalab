const express = require('express');
const router = express.Router();
const saranaController = require('./sarana.controller');
const verifyToken = require('../../shared/middleware/verifyToken');
const requireRole = require('../../shared/middleware/requireRole');
const { excelUpload } = require('../../shared/middleware/uploadExcel');

router.get('/', verifyToken, saranaController.getAll);

router.post(
    '/import',
    verifyToken,
    requireRole('admin', 'laboran'),
    excelUpload('file'),
    saranaController.importExcel
);

router.post('/', verifyToken, requireRole('admin', 'laboran'), saranaController.create);
router.post('/bulk-delete', verifyToken, requireRole('admin', 'laboran'), saranaController.bulkDelete);
router.put('/bulk-pindah', verifyToken, requireRole('admin', 'laboran'), saranaController.bulkPindah);
router.put('/:id/pindah', verifyToken, requireRole('admin', 'laboran'), saranaController.pindahLab);
router.put('/:id', verifyToken, requireRole('admin', 'laboran'), saranaController.update);
router.delete('/:id', verifyToken, requireRole('admin', 'laboran'), saranaController.remove);

module.exports = router;