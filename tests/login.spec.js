const { login } = require('../src/services/login.service');

describe('TDD - Módulo de Login (GarajeOk)', () => {

    // === HASH REAL ESTÁTICO ===
    // Generado previamente para la contraseña "admin123". No calculamos al vuelo para optimizar.
    const HASH_ESTATICO_ADMIN123 = "$2b$10$dTXbNldzu/kZ0pMiHwI.iexkdCum1CBd.cy/Hy2V3SgvlM6Oa.HX2";

    const usuarioMock = {
        id: 1,
        username: 'admin',
        rol: 'Administrador',
        passwordHash: HASH_ESTATICO_ADMIN123
    };

    test('Verde: Debe generar token si la contraseña es correcta usando hash estático', () => {
        const resultado = login (usuarioMock, 'admin123');

        expect(resultado.exito).toBe(true);
        expect(resultado.token).toBeDefined();
        expect(resultado.token.split('.').length).toBe(3);
    });

    test('Verde: NO debe generar token si la contraseña es incorrecta', () => {
        const resultado = login(usuarioMock, 'claveFalsa');

        expect(resultado.exito).toBe(false);
        expect(resultado.token).toBeUndefined();
        expect(resultado.mensaje).toBe("Usuario o contraseña incorrectos");
    });
});