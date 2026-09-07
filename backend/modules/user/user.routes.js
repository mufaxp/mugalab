const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const verifyToken = require('../../shared/middleware/verifyToken');
const requireRole = require('../../shared/middleware/requireRole');

// Semua route di bawah ini hanya bisa diakses oleh admin
router.get('/', verifyToken, requireRole('admin'), userController.getAll);
router.post('/', verifyToken, requireRole('admin'), userController.create);
router.put('/:id', verifyToken, requireRole('admin'), userController.update);
router.delete('/:id', verifyToken, requireRole('admin'), userController.remove);

module.exports = router;