// backend/tests/capacity.spec.js
const { verificarCapacidad } = require('../src/services/capacity.service');

describe('Capacidad Service - Pruebas de Aforo SaaS', () => {
    test('Debe permitir el ingreso si hay espacios disponibles para un carro', () => {
        const resultado = verificarCapacidad('Carro', 2); 
        expect(resultado.permitirIngreso).toBe(true);
        expect(resultado.mensaje).toBe('Espacio disponible');
    });

    test('Debe rechazar el ingreso si la capacidad de carros está agotada', () => {
        const resultado = verificarCapacidad('carro', 4); 
        expect(resultado.permitirIngreso).toBe(false);
        expect(resultado.mensaje).toBe('Capacidad de carros agotada');
    });

    test('Debe lanzar un error si el tipo de vehículo no está soportado en el SaaS', () => {
        expect(() => {
            verificarCapacidad('motocicleta', 0);
        }).toThrow('Tipo de vehículo no soportado en la plataforma');
    });
});