// src/controllers/auth.controller.js
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { login } = require('../services/login.service');
const { validarPoliticaPassword } = require('../services/auth.service');
const { enviarCorreoVerificacion } = require('../services/email.service');

async function iniciarSesion(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Debe ingresar usuario y contraseña" });
    }

    try {
        const queryUsuario = `
            SELECT id, username, password_hash as "passwordHash", nombres, apellidos, rol, email_verificado
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

        // Solo revisamos verificación DESPUÉS de confirmar la contraseña,
        // para no filtrar el estado de la cuenta a alguien que no la conoce.
        if (!usuario.email_verificado) {
            return res.status(403).json({ error: "Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada." });
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

async function registrarUsuario(req, res) {
    const { username, password, email, nombres, apellidos } = req.body;

    if (!username || !password || !email || !nombres || !apellidos) {
        return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }

    const validacionClave = validarPoliticaPassword(password);
    if (!validacionClave.valida) {
        return res.status(400).json({ error: validacionClave.mensaje });
    }

    try {
        const existeUser = await pool.query(
            'SELECT id FROM Usuarios WHERE username = $1 OR email = $2',
            [username, email]
        );
        if (existeUser.rows.length > 0) {
            return res.status(400).json({ error: "El nombre de usuario o correo ya están registrados." });
        }

        const nuevoHash = bcrypt.hashSync(password, 10);
        const tokenVerificacion = crypto.randomBytes(32).toString('hex');
        const tokenExpira = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

        const queryInsert = `
            INSERT INTO Usuarios 
                (username, password_hash, email, nombres, apellidos, rol, activo, email_verificado, token_verificacion, token_verificacion_expira)
            VALUES ($1, $2, $3, $4, $5, 'Operador', TRUE, FALSE, $6, $7)
            RETURNING id
        `;
        const nuevoUsuario = await pool.query(queryInsert, [
            username, nuevoHash, email, nombres, apellidos, tokenVerificacion, tokenExpira
        ]);

        // Si el correo falla, no perdemos el registro ya hecho — solo lo registramos en log.
        try {
            await enviarCorreoVerificacion(email, nombres, tokenVerificacion);
        } catch (errorCorreo) {
            console.error("No se pudo enviar el correo de verificación:", errorCorreo.message);
        }

        res.status(201).json({
            message: "¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.",
            usuarioId: nuevoUsuario.rows[0].id
        });

    } catch (error) {
        console.error("ERROR CRÍTICO EN REGISTRO:", error.message);
        res.status(500).json({ error: "Error interno al procesar el registro de usuario." });
    }
}

async function verificarCuenta(req, res) {
    const { token } = req.params;

    try {
        const resUsuario = await pool.query(
            'SELECT id, token_verificacion_expira FROM Usuarios WHERE token_verificacion = $1',
            [token]
        );

        if (resUsuario.rows.length === 0) {
            return res.status(400).send('<h2>Enlace de verificación inválido.</h2>');
        }

        const usuario = resUsuario.rows[0];

        if (new Date() > new Date(usuario.token_verificacion_expira)) {
            return res.status(400).send('<h2>El enlace de verificación ha expirado.</h2>');
        }

        await pool.query(
            `UPDATE Usuarios 
             SET email_verificado = TRUE, token_verificacion = NULL, token_verificacion_expira = NULL 
             WHERE id = $1`,
            [usuario.id]
        );

        res.send(`
            <html>
            <body style="font-family: Arial, sans-serif; text-align:center; padding-top: 80px; background:#E3F4E5;">
                <h1 style="color:#1E4432;">¡Cuenta verificada!</h1>
                <p>Ya puedes iniciar sesión en GarajeOk.</p>
                <a href="/" style="color:#1E4432; font-weight:bold;">Ir al login</a>
            </body>
            </html>
        `);

    } catch (error) {
        console.error("ERROR AL VERIFICAR CUENTA:", error.message);
        res.status(500).send('<h2>Error interno al verificar la cuenta.</h2>');
    }
}

module.exports = {
    iniciarSesion,
    registrarUsuario,
    verificarCuenta
};