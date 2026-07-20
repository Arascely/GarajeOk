// src/routes/parking.routes.js
const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parking.controller');
const { obligarAutenticacion } = require('../middlewares/auth.middleware');

router.post('/ingreso', obligarAutenticacion, parkingController.registrarIngreso);
router.post('/salida', obligarAutenticacion, parkingController.registrarSalida); // Ruta de salida protegida

module.exports = router;