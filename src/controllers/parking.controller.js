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

module.exports = {
    registrarIngreso
};