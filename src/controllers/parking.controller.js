// src/controllers/parking.controller.js
const { pool } = require('../config/database');
const { verificarCapacidad } = require('../services/capacity.service');
const { calcularMontoTarifa } = require('../services/billing.service');

/**
 * Registra el ingreso de un vehículo en la base de datos.
 */
async function registrarIngreso(req, res) {
    const { cliente_documento, nombres, apellidos, placa, tipo_vehiculo, espacio_codigo, tiene_llave } = req.body;

    try {
        // 1. Obtener ocupación actual para verificar capacidad antes de registrar
        const queryOcupacion = `
            SELECT COUNT(*) FROM HechosEstacionamiento 
            WHERE tipo_vehiculo = $1 AND estado = 'Activo'
        `;
        const resOcupacion = await pool.query(queryOcupacion, [tipo_vehiculo]);
        const ocupados = parseInt(resOcupacion.rows[0].count, 10);

        // 2. Usar tu servicio testeado para validar aforo
        const validacion = verificarCapacidad(tipo_vehiculo, ocupados);
        if (!validacion.permitirIngreso) {
            return res.status(400).json({ error: validacion.mensaje });
        }

        // 3. Registrar o actualizar Cliente
        let clienteRes = await pool.query('SELECT id FROM Clientes WHERE documento = $1', [cliente_documento]);
        let clienteId;
        if (clienteRes.rows.length === 0) {
            const insertCliente = `
                INSERT INTO Clientes (documento, nombres, apellidos) 
                VALUES ($1, $2, $3) RETURNING id
            `;
            const newCliente = await pool.query(insertCliente, [cliente_documento, nombres || 'CLIENTE', apellidos || 'TEMPORAL']);
            clienteId = newCliente.rows[0].id;
        } else {
            clienteId = clienteRes.rows[0].id;
        }

        // 4. Registrar o actualizar Vehículo
        let vehiculoRes = await pool.query('SELECT id FROM Vehiculos WHERE placa = $1', [placa]);
        let vehiculoId;
        if (vehiculoRes.rows.length === 0) {
            const insertVehiculo = `
                INSERT INTO Vehiculos (cliente_id, placa, tipo_vehiculo, tiene_llave) 
                VALUES ($1, $2, $3, $4) RETURNING id
            `;
            const newVehiculo = await pool.query(insertVehiculo, [clienteId, placa, tipo_vehiculo, tiene_llave || false]);
            vehiculoId = newVehiculo.rows[0].id;
        } else {
            vehiculoId = vehiculoRes.rows[0].id;
        }

        // 5. Verificar espacio físico disponible
        const espacioRes = await pool.query('SELECT id FROM EspaciosParking WHERE codigo_espacio = $1 AND estado = \'Disponible\'', [espacio_codigo]);
        if (espacioRes.rows.length === 0) {
            return res.status(400).json({ error: "El espacio solicitado no está disponible o no existe." });
        }
        const espacioId = espacioRes.rows[0].id;

        // 6. Registrar en HechosEstacionamiento
        const insertHecho = `
            INSERT INTO HechosEstacionamiento (cliente_id, vehiculo_id, espacio_id, hora_ingreso, tiene_llave, estado)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, 'Activo') RETURNING id, hora_ingreso
        `;
        const hechoSaved = await pool.query(insertHecho, [clienteId, vehiculoId, espacioId, tiene_llave || false]);
        const registroId = hechoSaved.rows[0].id;

        // 7. Generar Ticket
        const numeroTicket = `TK-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${registroId}`;
        const insertTicket = `
            INSERT INTO TicketsEstacionamiento (registro_id, numero_ticket, placa_vehiculo, tipo_vehiculo, nombre_cliente, documento_cliente, espacio_asignado, fecha_ingreso, estado_ticket)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Emitido') RETURNING *
        `;
        const ticketSaved = await pool.query(insertTicket, [
            registroId, numeroTicket, placa, tipo_vehiculo, 
            `${nombres || 'CLIENTE'} ${apellidos || 'TEMPORAL'}`, 
            cliente_documento, espacio_codigo, hechoSaved.rows[0].hora_ingreso
        ]);

        // 8. Ocupar Espacio
        await pool.query('UPDATE EspaciosParking SET estado = \'Ocupado\' WHERE id = $1', [espacioId]);

        res.status(201).json({
            message: "Ingreso registrado con éxito",
            ticket: ticketSaved.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error interno al procesar el ingreso", details: error.message });
    }
}


// Añadir al final de src/controllers/parking.controller.js
async function registrarSalida(req, res) {
    const { placa } = req.body;

    if (!placa) {
        return res.status(400).json({ error: "Debe proporcionar la placa del vehículo." });
    }

    try {
        // 1. Buscar el registro de estacionamiento activo para esa placa
        const queryActivo = `
            SELECT h.id as registro_id, h.hora_ingreso, h.espacio_id, v.tipo_vehiculo 
            FROM HechosEstacionamiento h
            JOIN Vehiculos v ON h.vehiculo_id = v.id
            WHERE v.placa = $1 AND h.estado = 'Activo'
        `;
        const resActivo = await pool.query(queryActivo, [placa]);

        if (resActivo.rows.length === 0) {
            return res.status(404).json({ error: "No se encontró ningún vehículo estacionado con esa placa." });
        }

        const registro = resActive = resActivo.rows[0];

        // 2. Calcular minutos transcurridos en tiempo real
        const horaIngreso = new Date(registro.hora_ingreso);
        const horaSalida = new Date();
        const diferenciaMilifrase = horaSalida - horaIngreso;
        const minutosEstadia = Math.ceil(diferenciaMilifrase / (1000 * 60)); // Convertir ms a minutos

        // Tarifa hardcodeada temporal para la entrega (Carro: Hora 5 / Día 40)
        const tarifaHora = registro.tipo_vehiculo === 'carro' ? 5.00 : 10.00;
        const tarifaDia = registro.tipo_vehiculo === 'carro' ? 40.00 : 80.00;

        // 3. Usar tu servicio de facturación testeado bajo TDD
        const liquidacion = calcularMontoTarifa(minutosEstadia, tarifaHora, tarifaDia);

        // 4. Actualizar HechosEstacionamiento (Cierre de estado)
        await pool.query(
            'UPDATE HechosEstacionamiento SET hora_salida = CURRENT_TIMESTAMP, monto_total = $1, estado = \'Finalizado\' WHERE id = $2',
            [liquidacion.total, registro.registro_id]
        );

        // 5. Liberar el espacio físico en el garaje
        await pool.query('UPDATE EspaciosParking SET estado = \'Disponible\' WHERE id = $1', [registro.espacio_id]);

        // 6. Actualizar el Ticket de Estacionamiento
        const updateTicket = `
            UPDATE TicketsEstacionamiento 
            SET fecha_salida = CURRENT_TIMESTAMP, monto_subtotal = $1, monto_igv = $2, monto_total = $3, estado_ticket = 'Pagado'
            WHERE registro_id = $4 RETURNING *
        `;
        const ticketActualizado = await pool.query(updateTicket, [
            liquidacion.subtotal, liquidacion.igv, liquidacion.total, registro.registro_id
        ]);

        res.status(200).json({
            message: "Salida registrada y procesada con éxito",
            tiempoEstadia: `${minutosEstadia} minutos`,
            detallesCobro: liquidacion,
            ticket: ticketActualizado.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error interno al procesar la salida del vehículo." });
    }
}

module.exports = {
    registrarIngreso,
    registrarSalida
};

