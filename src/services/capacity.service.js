// Límites de capacidad configurados según la especificación de tu garaje
const LIMITES_CAPACIDAD = {
    carro: 4,
    camion: 6,
    trailer: 13
};

// Formas plurales explícitas (evita reglas automáticas erróneas como "carro" + "es")
const PLURALES = {
    carro: 'carros',
    camion: 'camiones',
    trailer: 'trailers' // o 'tráileres', según prefieras
};

/**
 * Valida si un vehículo puede estacionar en base a la ocupación en tiempo real.
 * @param {string} tipoVehiculo - 'carro', 'camion' o 'trailer'
 * @param {number} ocupados - Cantidad de vehículos activos de ese tipo actualmente estacionados
 */
function verificarCapacidad(tipoVehiculo, ocupados) {
    const limiteMaximo = LIMITES_CAPACIDAD[tipoVehiculo];

    if (limiteMaximo === undefined) {
        throw new Error("Tipo de vehículo no soportado en la plataforma");
    }

    if (ocupados >= limiteMaximo) {
        return {
            permitirIngreso: false,
            mensaje: `Capacidad de ${PLURALES[tipoVehiculo]} agotada`
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