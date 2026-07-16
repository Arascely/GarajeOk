// tests/login.spec.js
const { login } = require('../src/services/login.service');
const bcrypt = require('bcryptjs');

describe('TDD - Módulo de Login (GarajeOk)', () => {

    const hashReal = bcrypt.hashSync('admin123', 10); // hash válido para las pruebas

    const usuarioMock = {
        id: 1,
        username: 'admin',
        rol: 'Administrador',
        passwordHash: hashReal
    };

    test('Rojo: Debe generar token si la contraseña es correcta', () => {
        const resultado = login(usuarioMock, 'admin123');

        expect(resultado.exito).toBe(true);
        expect(resultado.token).toBeDefined();
        expect(resultado.token.split('.').length).toBe(3);
    });

    test('Rojo: NO debe generar token si la contraseña es incorrecta', () => {
        const resultado = login(usuarioMock, 'claveFalsa');

        expect(resultado.exito).toBe(false);
        expect(resultado.token).toBeUndefined();
        expect(resultado.mensaje).toBe("Usuario o contraseña incorrectos");
    });
});