const express = require('express');
const router = express.Router();
const laporanPraktikumController = require('./laporan-praktikum.controller');
const verifyToken = require('../../shared/middleware/verifyToken');

// GET semua laporan praktikum
router.get('/', verifyToken, laporanPraktikumController.getAll);

// POST buat laporan praktikum
router.post('/', verifyToken, laporanPraktikumController.create);

// PUT edit laporan praktikum
router.put('/:id', verifyToken, laporanPraktikumController.update);

// DELETE hapus laporan praktikum
router.delete('/:id', verifyToken, laporanPraktikumController.remove);

module.exports = router;