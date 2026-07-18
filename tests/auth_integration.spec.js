// tests/auth_integration.spec.js
const { validarPoliticaPassword } = require('../src/services/auth.service');

describe('Pruebas de Integración y Reglas de Calidad - Seguridad de Contraseñas', () => {
    
    test('Debe rechazar contraseñas que no tengan letras mayúsculas', () => {
        const resultado = validarPoliticaPassword('password123'); // Todo minúsculas con números
        expect(resultado.valida).toBe(false);
        expect(resultado.mensaje).toContain('Debe incluir al menos una letra mayúscula');
    });

    test('Debe rechazar contraseñas que no tengan números', () => {
        const resultado = validarPoliticaPassword('PasswordSinNumeros'); // Mayúsculas pero sin números
        expect(resultado.valida).toBe(false);
        expect(resultado.mensaje).toContain('un número');
    });

    test('Debe aceptar contraseñas válidas (Con Mayúscula y Número configurado por el usuario)', () => {
        const resultado = validarPoliticaPassword('GarajeOk2026'); // Cumple con los dos requisitos
        expect(resultado.valida).toBe(true);
    });
});