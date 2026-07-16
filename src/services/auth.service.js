// src/services/auth.service.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET || 'MiClaveSecretaGarajeOk';

/**
 * Compara una contraseña en texto plano contra su hash en la base de datos.
 * @param {string} password - Contraseña ingresada.
 * @param {string} hash - Hash guardado en la base de datos.
 * @returns {boolean}
 */
function verificarPassword(password, hash) {
    return bcrypt.compareSync(password, hash);
}

/**
 * Genera un token JWT firmado para el usuario.
 * @param {object} usuario - Datos del operador ({ id, username, rol })
 * @returns {string} Token firmado.
 */
function generarToken(usuario) {
    return jwt.sign(
        { 
            id: usuario.id, 
            username: usuario.username, 
            rol: usuario.rol 
        }, 
        SECRET_KEY, 
        { expiresIn: '8h' } // El token expira automáticamente en 8 horas
    );
}

module.exports = {
    verificarPassword,
    generarToken
};