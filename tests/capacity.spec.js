// tests/capacity.spec.js
const { verificarCapacidad } = require('../src/services/capacity.service');

describe('TDD - Módulo de Control de Capacidad (GarajeOk)', () => {

    test('Rojo: Debe permitir el ingreso si el aforo no está al límite', () => {
        const ocupadosActualmente = 2;
        const tipoVehiculo = 'carro'; // Límite de carros es 4

        const resultado = verificarCapacidad(tipoVehiculo, ocupadosActualmente);
        
        expect(resultado.permitirIngreso).toBe(true);
        expect(resultado.mensaje).toBe("Espacio disponible");
    });

    test('Rojo: Debe bloquear el ingreso si se alcanza el límite exacto de carros', () => {
        const ocupadosActualmente = 4; // Límite alcanzado
        const tipoVehiculo = 'carro';

        const resultado = verificarCapacidad(tipoVehiculo, ocupadosActualmente);

        expect(resultado.permitirIngreso).toBe(false);
        expect(resultado.mensaje).toBe("Capacidad de carros agotada");
    });

    test('Rojo: Debe bloquear el ingreso si se alcanza el límite exacto de camiones', () => {
        const ocupadosActualmente = 6; // Límite de camiones es 6
        const tipoVehiculo = 'camion';

        const resultado = verificarCapacidad(tipoVehiculo, ocupadosActualmente);

        expect(resultado.permitirIngreso).toBe(false);
        expect(resultado.mensaje).toBe("Capacidad de camiones agotada");
    });

    test('Rojo: Debe lanzar un error si se ingresa un tipo de vehículo no parametrizado', () => {
        expect(() => {
            verificarCapacidad('mototaxi', 0);
        }).toThrow("Tipo de vehículo no soportado en la plataforma");
    });
});