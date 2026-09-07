const express = require('express');
const router = express.Router();
const labController = require('./lab.controller');
const verifyToken = require('../../shared/middleware/verifyToken');

// GET semua lab (publik)
router.get('/', labController.getAll);

// POST tambah lab (harus login)
router.post('/', verifyToken, labController.create);

// PUT edit lab (harus login)
router.put('/:id', verifyToken, labController.update);

// DELETE hapus lab (harus login)
router.delete('/:id', verifyToken, labController.remove);

module.exports = router;