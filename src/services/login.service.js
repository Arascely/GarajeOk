// src/services/login.service.js
const { verificarPassword, generarToken } = require('./auth.service');

/**
 * Orquesta el flujo de login: valida contraseña y, si es correcta,
 * genera el token. Si falla, no llega a generar nada.
 * @param {object} usuario - Datos del usuario incluyendo el hash guardado ({ id, username, rol, passwordHash })
 * @param {string} passwordIngresada - Contraseña en texto plano ingresada por el usuario
 * @returns {object} { exito: boolean, token?: string, mensaje?: string }
 */
function login(usuario, passwordIngresada) {
    const esValida = verificarPassword(passwordIngresada, usuario.passwordHash);

    if (!esValida) {
        return {
            exito: false,
            mensaje: "Usuario o contraseña incorrectos"
        };
    }

    // Solo si la contraseña coincide, corre el código que ya tenías
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