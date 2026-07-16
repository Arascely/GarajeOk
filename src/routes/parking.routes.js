// src/routes/parking.routes.js
const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parking.controller');
const { obligarAutenticacion } = require('../middlewares/auth.middleware');

// Ahora la ruta POST exige pasar el token JWT antes de permitir registrar un ingreso
router.post('/ingreso', obligarAutenticacion, parkingController.registrarIngreso);

module.exports = router;