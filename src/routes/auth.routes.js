// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');


router.post('/login', authController.iniciarSesion);
router.post('/registro', authController.registrarUsuario);

module.exports = router;