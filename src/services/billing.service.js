// src/services/billing.service.js

const MINUTOS_EN_UN_DIA = 1440;
const MINUTOS_EN_UNA_HORA = 60.0;
const TASA_IGV_PERU = 1.18;

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

    if (minutos < MINUTOS_EN_UN_DIA) { 
        diasCobrados = 0;
        horasCobradas = Math.ceil(minutos / MINUTOS_EN_UNA_HORA);
        total = horasCobradas * tarifaHora;
    } else {
        diasCobrados = Math.floor(minutos / MINUTOS_EN_UN_DIA);
        const minutosRemanentes = minutos % MINUTOS_EN_UN_DIA;
        horasCobradas = Math.ceil(minutosRemanentes / MINUTOS_EN_UNA_HORA);
        total = (diasCobrados * tarifaDia) + (horasCobradas * tarifaHora);
    }

    // Desglose del 18% de IGV
    const subtotal = parseFloat((total / TASA_IGV_PERU).toFixed(2));
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