// src/routes/parking.routes.js
const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parking.controller');

// Definición de la ruta POST para ingresos
router.post('/ingreso', parkingController.registrarIngreso);

module.exports = router;