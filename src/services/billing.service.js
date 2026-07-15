// src/services/billing.service.js

/**
 * Calcula la tarifa de estacionamiento aplicando el algoritmo mixto e IGV.
 * @param {number} minutos - Minutos totales transcurridos.
 * @param {number} tarifaHora - Precio por hora del vehículo.
 * @param {number} tarifaDia - Precio por día del vehículo.
 */
function calcularMontoTarifa(minutos, tarifaHora, tarifaDia) {
    let total = 0;
    let horasCobradas = 0;
    let diasCobrados = 0;

    if (minutos < 1440) { // Menos de 24 horas (un día entero)
        diasCobrados = 0;
        horasCobradas = Math.ceil(minutos / 60.0); // Redondeo de horas hacia arriba
        total = horasCobradas * tarifaHora;
    } else {
        diasCobrados = Math.floor(minutos / 1440);
        const minutosRemanentes = minutos % 1440;
        horasCobradas = Math.ceil(minutosRemanentes / 60.0);
        total = (diasCobrados * tarifaDia) + (horasCobradas * tarifaHora);
    }

    // Desglose matemático del 18% de IGV peruano ya incluido en el precio final
    const subtotal = parseFloat((total / 1.18).toFixed(2));
    const igv = parseFloat((total - subtotal).toFixed(2));

    return {
        total: parseFloat(total.toFixed(2)),
        subtotal,
        igv,
        horasCobradas,
        diasCobrados
    };
}

module.exports = {
    calcularMontoTarifa
};