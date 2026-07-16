// src/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET || 'MiClaveSecretaSuperProtegidaParaGarajeOk';

/**
 * Middleware para asegurar que el usuario esté autenticado mediante JWT.
 */
function obligarAutenticacion(req, res, next) {
    const authHeader = req.headers['authorization'];

    // Validar formato estándar: Bearer <TOKEN>
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Acceso denegado. No se proporcionó un token válido." });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verificar la firma y vigencia del token
        const decodificado = jwt.verify(token, SECRET_KEY);
        
        // Adjuntar los datos del operador a la petición para auditorías futuras
        req.usuario = decodificado;
        
        next(); // Permitir el paso al controlador
    } catch (error) {
        return res.status(401).json({ error: "Token inválido o expirado." });
    }
}

module.exports = {
    obligarAutenticacion
};