// tests/auth.spec.js
const { verificarPassword, generarToken } = require('../src/services/auth.service');

describe('TDD - Módulo de Seguridad y Autenticación (GarajeOk)', () => {

    test('Rojo: Debe validar correctamente una contraseña cifrada con Bcrypt', () => {
        // Contraseña real: "admin123"
        // Hash generado previamente con Bcrypt
        const passwordPlana = "admin123";
        const hashCorrecto = "$2a$10$R77p.zDpx7C7bS.YvY0XOuE8uMvK8C4WqE9.pREqX1r3oA3fQyZ2q";

        const esValida = verificarPassword(passwordPlana, hashCorrecto);
        expect(esValida).toBe(true);
    });

    test('Rojo: Debe rechazar contraseñas incorrectas', () => {
        const passwordPlanaIncorrecta = "claveFalsa";
        const hashCorrecto = "$2a$10$R77p.zDpx7C7bS.YvY0XOuE8uMvK8C4WqE9.pREqX1r3oA3fQyZ2q";

        const esValida = verificarPassword(passwordPlanaIncorrecta, hashCorrecto);
        expect(esValida).toBe(false);
    });

    test('Rojo: Debe firmar y generar un token JWT válido', () => {
        const usuarioPayload = { id: 1, username: 'admin', rol: 'Administrador' };
        
        const token = generarToken(usuarioPayload);
        
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        // Un JWT siempre tiene una estructura dividida en 3 partes por puntos (Header.Payload.Signature)
        expect(token.split('.').length).toBe(3);
    });
});