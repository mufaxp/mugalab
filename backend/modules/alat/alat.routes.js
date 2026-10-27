const express = require('express');
const router = express.Router();
const alatController = require('./alat.controller');
const verifyToken = require('../../shared/middleware/verifyToken');
const requireRole = require('../../shared/middleware/requireRole');
const { excelUpload } = require('../../shared/middleware/uploadExcel');

router.get('/', verifyToken, alatController.getAll);

// Import Excel
router.post(
    '/import',
    verifyToken,
    requireRole('admin', 'laboran'),
    excelUpload('file'),
    alatController.importExcel
);

router.post('/', verifyToken, requireRole('admin', 'laboran'), alatController.create);
router.put('/:id', verifyToken, requireRole('admin', 'laboran'), alatController.update);
router.delete('/:id', verifyToken, requireRole('admin', 'laboran'), alatController.remove);

module.exports = router;