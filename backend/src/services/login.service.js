// src/services/login.service.js
const { verificarPassword, generarToken } = require('./auth.service');

/**
 * Orquesta el flujo de login: valida contraseña y, si es correcta,
 * genera el token. No accede a la base de datos — recibe el usuario
 * ya consultado desde el controller.
 * @param {object} usuario - { id, username, rol, passwordHash }
 * @param {string} passwordIngresada - Contraseña en texto plano
 * @returns {object} { exito, token?, mensaje? }
 */
function login(usuario, passwordIngresada) {
    const esValida = verificarPassword(passwordIngresada, usuario.passwordHash);

    if (!esValida) {
        return {
            exito: false,
            mensaje: "Usuario o contraseña incorrectos"
        };
    }

    const token = generarToken({
        id: usuario.id,
        username: usuario.username,
        rol: usuario.rol
    });

    return {
        exito: true,
        token
    };
}

module.exports = {
    login
};