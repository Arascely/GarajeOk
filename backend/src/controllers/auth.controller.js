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
            SELECT id, garaje_id, username, password_hash as "passwordHash", nombres, apellidos, rol, email_verificado
            FROM Usuarios 
            WHERE username = $1 AND activo = TRUE
        `;
        const resUsuario = await pool.query(queryUsuario, [username]);

        if (resUsuario.rows.length === 0) {
            return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
        }

        const usuario = resUsuario.rows[0];
        const resultadoLogin = login(usuario, password);

        if (!resultadoLogin.exito) {
            return res.status(401).json({ error: resultadoLogin.mensaje });
        }

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
                garaje_id: usuario.garaje_id, // Contexto Multi-Tenant inyectado en la sesión
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
    // Al registrarse en el SaaS, se solicitan datos de la cuenta y los datos básicos del negocio (empresa)
    const { username, password, email, nombres, apellidos, empresa_nombre, empresa_ruc } = req.body;

    if (!username || !password || !email || !nombres || !apellidos || !empresa_nombre || !empresa_ruc) {
        return res.status(400).json({ error: "Todos los campos, incluyendo el RUC y nombre de la empresa, son requeridos para el aprovisionamiento SaaS." });
    }

    if (empresa_ruc.trim().length !== 11) {
        return res.status(400).json({ error: "El RUC de la empresa debe tener estrictamente 11 dígitos." });
    }

    const validacionClave = validarPoliticaPassword(password);
    if (!validacionClave.valida) {
        return res.status(400).json({ error: validacionClave.mensaje });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Validaciones de duplicados globales
        const existeUser = await client.query('SELECT id FROM Usuarios WHERE username = $1 OR email = $2', [username, email]);
        if (existeUser.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "El nombre de usuario o correo ya están registrados." });
        }

        const existeGaraje = await client.query('SELECT id FROM Garajes WHERE ruc = $1', [empresa_ruc]);
        if (existeGaraje.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "Esta empresa (RUC) ya se encuentra registrada en el SaaS." });
        }

        // 1. Aprovisionamiento automático de la empresa (Tenant)
        const queryGaraje = `INSERT INTO Garajes (nombre_comercial, ruc) VALUES ($1, $2) RETURNING id`;
        const nuevoGaraje = await client.query(queryGaraje, [empresa_nombre.trim(), empresa_ruc.trim()]);
        const garajeId = nuevoGaraje.rows[0].id;

        // 2. Inicialización automática de Tarifas predeterminadas para este Garaje
        const queryTarifasDefault = `
            INSERT INTO Tarifas (garaje_id, tipo_vehiculo, tarifa_hora, tarifa_dia, tarifa_mensual) VALUES
            ($1, 'carro', 5.00, 40.00, 800.00),
            ($1, 'camion', 10.00, 80.00, 1600.00),
            ($1, 'trailer', 15.00, 120.00, 2400.00)
        `;
        await client.query(queryTarifasDefault, [garajeId]);

        // 3. Inicialización automática de Espacios de Parking base para este Garaje
        const queryEspaciosDefault = `
            INSERT INTO EspaciosParking (garaje_id, codigo_espacio, tipo_vehiculo_permitido) VALUES
            ($1, 'A1', 'carro'), ($1, 'A2', 'carro'), ($1, 'A3', 'carro'),
            ($1, 'C1', 'camion'), ($1, 'C2', 'camion'),
            ($1, 'T1', 'trailer')
        `;
        await client.query(queryEspaciosDefault, [garajeId]);

        // 4. Creación del Usuario vinculado directamente a su nuevo Garaje como Administrador
        const nuevoHash = bcrypt.hashSync(password, 10);
        const tokenVerificacion = crypto.randomBytes(32).toString('hex');
        const tokenExpira = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Horas

        const queryInsertUser = `
            INSERT INTO Usuarios 
                (garaje_id, username, password_hash, email, nombres, apellidos, rol, activo, email_verificado, token_verificacion, token_verificacion_expira)
            VALUES ($1, $2, $3, $4, $5, $6, 'Administrador', TRUE, FALSE, $7, $8)
            RETURNING id
        `;
        const nuevoUsuario = await client.query(queryInsertUser, [
            garajeId, username, nuevoHash, email, nombres, apellidos, tokenVerificacion, tokenExpira
        ]);

        await client.query('COMMIT');

        // Envío asíncrono de correo de verificación sin bloquear la respuesta de la transacción
        try {
            await enviarCorreoVerificacion(email, nombres, tokenVerificacion);
        } catch (errorCorreo) {
            console.error("Fallo no bloqueante al enviar correo de verificación:", errorCorreo.message);
        }

        res.status(201).json({
            message: "¡Registro de cuenta de empresa exitoso! Revisa tu correo para confirmar tu cuenta y acceder a tu dashboard.",
            usuarioId: nuevoUsuario.rows[0].id,
            garajeId: garajeId
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("ERROR CRÍTICO EN APORTE REGISTRO SAAS:", error.message);
        res.status(500).json({ error: "Error interno al aprovisionar tu cuenta e infraestructura SaaS." });
    } finally {
        client.release();
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
            return res.status(400).json({ error: "Enlace de verificación inválido o ya utilizado." });
        }

        const usuario = resUsuario.rows[0];
        if (new Date() > new Date(usuario.token_verificacion_expira)) {
            return res.status(400).json({ error: "El enlace de verificación ha expirado." });
        }

        await pool.query(
            `UPDATE Usuarios 
             SET email_verificado = TRUE, token_verificacion = NULL, token_verificacion_expira = NULL 
             WHERE id = $1`,
            [usuario.id]
        );
        
        // Retorno de respuesta JSON limpia para integraciones SPA fluidas
        res.status(200).json({ message: "Cuenta verificada exitosamente. Ya puedes iniciar sesión desde el panel de control." });
    } catch (error) {
        console.error("ERROR AL VERIFICAR CUENTA:", error.message);
        res.status(500).json({ error: "Error interno en el servidor al verificar tu cuenta." });
    }
}

module.exports = { iniciarSesion, registrarUsuario, verificarCuenta };