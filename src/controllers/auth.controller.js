// src/controllers/auth.controller.js
const { pool } = require('../config/database');
const { login } = require('../services/login.service');

async function iniciarSesion(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Debe ingresar usuario y contraseña" });
    }

    try {
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
        usuario.passwordHash = usuario.passwordHash || usuario.password_hash;

        const resultadoLogin = login(usuario, password);

        if (!resultadoLogin.exito) {
            return res.status(401).json({ error: resultadoLogin.mensaje });
        }

        await pool.query(
            'UPDATE Usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = $1',
            [usuario.id]
        );

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
        console.error("ERROR CRÍTICO EN LOGIN:", error.message);
        res.status(500).json({ error: "Error interno en el servidor de autenticación" });
    }
}

module.exports = {
    iniciarSesion
};