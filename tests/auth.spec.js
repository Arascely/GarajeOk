// tests/auth.spec.js
const { verificarPassword, generarToken } = require('../src/services/auth.service');
const bcrypt = require('bcryptjs');

describe('TDD - Módulo de Seguridad y Autenticación (GarajeOk)', () => {

    const passwordPlana = "admin123";
    const hashCorrecto = bcrypt.hashSync(passwordPlana, 10); // ← hash real, generado en runtime

    test('Rojo: Debe validar correctamente una contraseña cifrada con Bcrypt', () => {
        const esValida = verificarPassword(passwordPlana, hashCorrecto);
        expect(esValida).toBe(true);
    });

    test('Rojo: Debe rechazar contraseñas incorrectas', () => {
        const passwordPlanaIncorrecta = "claveFalsa";

        const esValida = verificarPassword(passwordPlanaIncorrecta, hashCorrecto);
        expect(esValida).toBe(false);
    });

    test('Rojo: Debe firmar y generar un token JWT válido', () => {
        const usuarioPayload = { id: 1, username: 'admin', rol: 'Administrador' };
        
        const token = generarToken(usuarioPayload);
        
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token.split('.').length).toBe(3);
    });
});