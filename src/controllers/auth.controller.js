// src/controllers/auth.controller.js
const { pool } = require('../config/database');
const { login } = require('../services/login.service');

/**
 * Endpoint para autenticar operadores y administradores.
 * POST /api/auth/login
 */
async function iniciarSesion(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Debe ingresar usuario y contraseña" });
    }

    try {
        // 1. Buscar al usuario en la base de datos de Neon
        const queryUsuario = `
            SELECT id, username, password_hash as "passwordHash", nombres, apellidos, rol 
            FROM Usuarios 
            WHERE username = $1 AND activo = TRUE
        `;
        const resUsuario = await pool.query(queryUsuario, [username]);

        if (resUsuario.rows.length === 0) {
            return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
        }

        const usuario = resUsuario.rows[0];

        // 2. Usar tu servicio de login testeado (TDD) para validar
        usuario.passwordHash = usuario.passwordHash || usuario.password_hash;
        const resultadoLogin = login(usuario, password);
        if (!resultadoLogin.exito) {
            return res.status(401).json({ error: resultadoLogin.mensaje });
        }

        // 3. Registrar el último acceso en la base de datos (Auditoría)
        await pool.query(
            'UPDATE Usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = $1',
            [usuario.id]
        );

        // 4. Retornar el token y los datos de sesión del operador
        res.status(200).json({
            message: "¡Bienvenido a GarajeOk!",
            token: resultadoLogin.token,
            user: {
                id: usuario.id,
                username: usuario.username,
                nombre: `${usuario.nombres} ${usuario.apellidos}`,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error interno en el servidor de autenticación" });
    }
}

module.exports = {
    iniciarSesion
};