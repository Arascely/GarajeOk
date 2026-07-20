// backend/src/services/auth.service.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Eliminado el fallback inseguro para proteger el entorno de producción
if (!process.env.JWT_SECRET) {
    throw new Error("ERROR CRÍTICO: La variable de entorno JWT_SECRET no está definida.");
}

const SECRET_KEY = process.env.JWT_SECRET;

function verificarPassword(password, hash) {
    return bcrypt.compareSync(password, hash);
}

/**
 * Genera un token JWT firmado inyectando el contexto Multi-Tenant.
 * @param {object} usuario - Datos del operador ({ id, username, rol, garaje_id })
 */
function generarToken(usuario) {
    return jwt.sign(
        { 
            id: usuario.id, 
            garaje_id: usuario.garaje_id, // Atributo core para aislamiento de datos en el SaaS
            username: usuario.username, 
            rol: usuario.rol 
        }, 
        SECRET_KEY, 
        { expiresIn: '8h' }
    );
}

// Implementación de la política robusta para el controlador
function validarPoliticaPassword(password) {
    const tieneMayuscula = /[A-Z]/.test(password);
    const tieneNumero = /[0-9]/.test(password);

    if (!tieneMayuscula || !tieneNumero) {
        return {
            valida: false,
            mensaje: "La contraseña es débil. Debe incluir al menos una letra mayúscula y un número."
        };
    }
    return { valida: true, mensaje: "Contraseña segura" };
}

module.exports = {
    verificarPassword,
    generarToken,
    validarPoliticaPassword
};