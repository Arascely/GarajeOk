// src/services/capacity.service.js

// Mantener los límites de capacidad definidos
const LIMITES_CAPACIDAD = {
    carro: 4,
    camion: 6,
    trailer: 13
};

const PLURALES = {
    carro: 'carros',
    camion: 'camiones',
    trailer: 'trailers'
};

/**
 * Valida si un vehículo puede estacionar en base a la ocupación en tiempo real.
 * @param {string} tipoVehiculo - 'carro', 'camion' o 'trailer'
 * @param {number} ocupados - Cantidad de vehículos activos actualmente estacionados
 */
function verificarCapacidad(tipoVehiculo, ocupados) {
    // Robustez: Convertimos a minúsculas para evitar fallos por tipeo (ej. "Carro" o "CARRO")
    const tipoFormateado = String(tipoVehiculo).toLowerCase();
    const limiteMaximo = LIMITES_CAPACIDAD[tipoFormateado];

    if (limiteMaximo === undefined) {
        throw new Error("Tipo de vehículo no soportado en la plataforma");
    }

    if (ocupados >= limiteMaximo) {
        return {
            permitirIngreso: false,
            mensaje: `Capacidad de ${PLURALES[tipoFormateado]} agotada`
        };
    }

    return {
        permitirIngreso: true,
        mensaje: "Espacio disponible"
    };
}

module.exports = {
    verificarCapacidad
};