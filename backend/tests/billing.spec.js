// tests/billing.spec.js
const { calcularMontoTarifa } = require('../src/services/billing.service');

describe('TDD - Módulo de Liquidación de Tarifas (GarajeOk)', () => {
    
    test('Rojo: Debe calcular la tarifa por horas redondeando hacia arriba', () => {
        const minutosEstadia = 75; // 1 hora y 15 minutos -> Debe cobrar 2 horas
        const tarifaHora = 5.00;   // Tarifa estándar de carro
        const tarifaDia = 40.00;

        const resultado = calcularMontoTarifa(minutosEstadia, tarifaHora, tarifaDia);
        
        expect(resultado.total).toBe(10.00); // 2 horas * 5.00
        expect(resultado.horasCobradas).toBe(2);
        expect(resultado.diasCobrados).toBe(0);
    });

    test('Rojo: Debe calcular la tarifa para estadías largas (cobro mixto por días y horas)', () => {
        const minutosEstadia = 1500; // 25 horas -> 1 día (24h) + 1 hora remanente
        const tarifaHora = 10.00;    // Tarifa de camión
        const tarifaDia = 80.00;

        const resultado = calcularMontoTarifa(minutosEstadia, tarifaHora, tarifaDia);

        expect(resultado.total).toBe(90.00); // 1 día (80) + 1 hora (10)
        expect(resultado.diasCobrados).toBe(1);
        expect(resultado.horasCobradas).toBe(1);
    });

    test('Rojo: Debe desglosar correctamente el 18% de IGV peruano', () => {
        const minutosEstadia = 60; // 1 hora exacta
        const tarifaHora = 11.80;  // Tarifa con decimales para verificar precisión
        const tarifaDia = 80.00;

        const resultado = calcularMontoTarifa(minutosEstadia, tarifaHora, tarifaDia);

        // Si el total es 11.80, el subtotal neto debe ser 10.00 y el IGV 1.80
        expect(resultado.total).toBe(11.80);
        expect(resultado.subtotal).toBe(10.00);
        expect(resultado.igv).toBe(1.80);
    });
});