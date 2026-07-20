// backend/tests/login.spec.js
const { login } = require('../src/services/login.service');
const bcryptjs = require('bcryptjs');

describe('TDD - Módulo de Login (GarajeOk)', () => {
    
    test('Debe autenticar correctamente con credenciales válidas', () => {
        const passwordPlana = 'admin';
        const passwordHash = bcryptjs.hashSync(passwordPlana, 10);

        const usuarioMock = {
            id: 1,
            username: 'operador1',
            rol: 'Operador',
            passwordHash: passwordHash,
            garaje_id: 5
        };

        const resultado = login(usuarioMock, 'admin');
        
        expect(resultado.exito).toBe(true);
        expect(resultado.token).toBeDefined();
    });

    test('Debe rechazar la autenticación si la contraseña es incorrecta', () => {
        const passwordHash = bcryptjs.hashSync('admin', 10);

        const usuarioMock = {
            id: 1,
            username: 'operador1',
            rol: 'Operador',
            passwordHash: passwordHash,
            garaje_id: 5
        };

        const resultado = login(usuarioMock, 'clave_erronea');
        
        expect(resultado.exito).toBe(false);
        expect(resultado.mensaje).toBe('Usuario o contraseña incorrectos');
    });
});