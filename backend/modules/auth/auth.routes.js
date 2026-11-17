const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');

// POST /api/auth/login
router.post('/login', authController.login);
router.post('/login-face', authController.loginFace);

module.exports = router;