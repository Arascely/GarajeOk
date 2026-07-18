// Añadir al final de src/controllers/auth.controller.js
const { validarPoliticaPassword } = require('../services/auth.service');
const bcrypt = require('bcryptjs');

async function registrarUsuario(req, res) {
    const { username, password, email, nombres, apellidos } = req.body;

    if (!username || !password || !email || !nombres || !apellidos) {
        return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }

    // 1. Validar la política de seguridad (Mínimo una mayúscula y un número)
    const validacionClave = validarPoliticaPassword(password);
    if (!validacionClave.valida) {
        return res.status(400).json({ error: validacionClave.mensaje });
    }

    try {
        // 2. Verificar si el usuario o correo ya existen en Neon/Supabase
        const existeUser = await pool.query('SELECT id FROM Usuarios WHERE username = $1 OR email = $2', [username, email]);
        if (existeUser.rows.length > 0) {
            return res.status(400).json({ error: "El nombre de usuario o correo ya están registrados." });
        }

        // 3. Encriptar la contraseña personalizada elegida por el usuario
        const salt = bcrypt.genSaltSync(10);
        const nuevoHash = bcrypt.hashSync(password, salt);

        // 4. Insertar en la base de datos con estado pendiente de verificación
        const queryInsert = `
            INSERT INTO Usuarios (username, password_hash, email, nombres, apellidos, rol, activo, email_verificado)
            VALUES ($1, $2, $3, $4, $5, 'Operador', TRUE, FALSE) RETURNING id, email
        `;
        const nuevoUsuario = await pool.query(queryInsert, [username, nuevoHash, email, nombres, apellidos]);

        res.status(201).json({
            message: "¡Registro exitoso! Se ha enviado un mensaje de confirmación a su correo para activar la cuenta.",
            usuarioId: nuevoUsuario.rows[0].id
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error interno al procesar el registro de usuario." });
    }
}

// Recuerda agregarlo a tus exportaciones al final del archivo:
module.exports = {
    iniciarSesion,
    registrarUsuario
};