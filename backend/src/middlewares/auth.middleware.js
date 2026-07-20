// src/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Eliminado el fallback inseguro. Obliga a que exista la variable de entorno.
if (!process.env.JWT_SECRET) {
    throw new Error("ERROR CRÍTICO: La variable de entorno JWT_SECRET no está definida.");
}

const SECRET_KEY = process.env.JWT_SECRET;

function obligarAutenticacion(req, res, next) {
    const authHeader = req.headers['authorization']; // [cite: 95]

    if (!authHeader || !authHeader.startsWith('Bearer ')) { // [cite: 96]
        return res.status(401).json({ error: "Acceso denegado. No se proporcionó un token válido." });
    }

    const token = authHeader.split(' ')[1]; // [cite: 97]

    try {
        const decodificado = jwt.verify(token, SECRET_KEY); // [cite: 97]
        req.usuario = decodificado; // [cite: 98]
        next(); // [cite: 99]
    } catch (error) {
        return res.status(401).json({ error: "Token inválido o expirado." }); // [cite: 100]
    }
}

module.exports = { obligarAutenticacion };