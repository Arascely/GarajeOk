// src/controllers/parking.controller.js
const { pool } = require('../config/database');
const { verificarCapacidad } = require('../services/capacity.service');
const { calcularMontoTarifa } = require('../services/billing.service');

const DNI_REGEX = /^\d{8}$/;
// Soporta formato estándar peruano: ABC-123 (autos) o ABCD-123 / AB-1234 (motos/otros)
const PLACA_REGEX = /^[A-Z0-9]{2,4}-[A-Z0-9]{3,4}$/;

async function registrarIngreso(req, res) {
    const { cliente_documento, nombres, apellidos, placa, tipo_vehiculo, espacio_codigo, tiene_llave } = req.body;

    if (!cliente_documento || !DNI_REGEX.test(cliente_documento.trim())) {
        return res.status(400).json({ error: "El documento (DNI) debe contener estrictamente 8 dígitos numéricos." });
    }
    
    const placaFormateada = placa ? placa.trim().toUpperCase() : '';
    if (!PLACA_REGEX.test(placaFormateada)) {
        return res.status(400).json({ error: "El formato de la placa es inválido (Ejemplo válido: ABC-123)." });
    }

    if (!tipo_vehiculo || !espacio_codigo) {
        return res.status(400).json({ error: "Faltan parámetros obligatorios en la solicitud." });
    }

    const tipoVehiculoFormateado = tipo_vehiculo.trim().toLowerCase();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const queryOcupacion = `
            SELECT COUNT(*) FROM HechosEstacionamiento 
            WHERE LOWER(tipo_vehiculo) = $1 AND estado = 'Activo'
        `;
        const resOcupacion = await client.query(queryOcupacion, [tipoVehiculoFormateado]);
        const ocupados = parseInt(resOcupacion.rows[0].count, 10);

        const validacion = verificarCapacidad(tipoVehiculoFormateado, ocupados);
        if (!validacion.permitirIngreso) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: validacion.mensaje });
        }

        // Registrar o actualizar Cliente
        let clienteRes = await client.query('SELECT id FROM Clientes WHERE documento = $1', [cliente_documento]);
        let clienteId;
        if (clienteRes.rows.length === 0) {
            const insertCliente = `
                INSERT INTO Clientes (documento, nombres, apellidos) 
                VALUES ($1, $2, $3) RETURNING id
            `;
            const newCliente = await client.query(insertCliente, [cliente_documento, nombres || 'CLIENTE', apellidos || 'TEMPORAL']);
            clienteId = newCliente.rows[0].id;
        } else {
            clienteId = clienteRes.rows[0].id;
        }

        // Registrar o actualizar Vehículo
        let vehiculoRes = await client.query('SELECT id FROM Vehiculos WHERE placa = $1', [placaFormateada]);
        let vehiculoId;
        if (vehiculoRes.rows.length === 0) {
            const insertVehiculo = `
                INSERT INTO Vehiculos (cliente_id, placa, tipo_vehiculo, tiene_llave) 
                VALUES ($1, $2, $3, $4) RETURNING id
            `;
            const newVehiculo = await client.query(insertVehiculo, [clienteId, placaFormateada, tipoVehiculoFormateado, tiene_llave || false]);
            vehiculoId = newVehiculo.rows[0].id;
        } else {
            vehiculoId = vehiculoRes.rows[0].id;
        }

        // Bloqueo Concurrente FOR UPDATE para evitar colisiones de espacio físico
        const espacioRes = await client.query(
            "SELECT id FROM EspaciosParking WHERE codigo_espacio = $1 AND estado = 'Disponible' FOR UPDATE", 
            [espacio_codigo]
        );
        if (espacioRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "El espacio solicitado no está disponible o no existe." });
        }
        const espacioId = espacioRes.rows[0].id;

        const insertHecho = `
            INSERT INTO HechosEstacionamiento (cliente_id, vehiculo_id, espacio_id, hora_ingreso, tiene_llave, estado, tipo_vehiculo)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, 'Activo', $5) RETURNING id, hora_ingreso
        `;
        const hechoSaved = await client.query(insertHecho, [clienteId, vehiculoId, espacioId, tiene_llave || false, tipoVehiculoFormateado]);
        const registroId = hechoSaved.rows[0].id;

        const numeroTicket = `TK-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${registroId}`;
        const insertTicket = `
            INSERT INTO TicketsEstacionamiento (registro_id, numero_ticket, placa_vehiculo, tipo_vehiculo, nombre_cliente, documento_cliente, espacio_asignado, fecha_ingreso, estado_ticket)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Emitido') RETURNING *
        `;
        const ticketSaved = await client.query(insertTicket, [
            registroId, numeroTicket, placaFormateada, tipoVehiculoFormateado, 
            `${nombres || 'CLIENTE'} ${apellidos || 'TEMPORAL'}`, 
            cliente_documento, espacio_codigo, hechoSaved.rows[0].hora_ingreso
        ]);

        await client.query("UPDATE EspaciosParking SET estado = 'Ocupado' WHERE id = $1", [espacioId]);

        await client.query('COMMIT');

        res.status(201).json({
            message: "Ingreso registrado con éxito",
            ticket: ticketSaved.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error en registrarIngreso:", error);
        res.status(500).json({ error: "Error interno al procesar el ingreso seguro" });
    } finally {
        client.release();
    }
}

async function registrarSalida(req, res) {
    const { placa } = req.body;
    if (!placa) {
        return res.status(400).json({ error: "Debe proporcionar la placa del vehículo." });
    }

    const placaFormateada = placa.trim().toUpperCase();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const queryActivo = `
            SELECT h.id as registro_id, h.hora_ingreso, h.espacio_id, LOWER(v.tipo_vehiculo) as tipo_vehiculo 
            FROM HechosEstacionamiento h
            JOIN Vehiculos v ON h.vehiculo_id = v.id
            WHERE v.placa = $1 AND h.estado = 'Activo' FOR UPDATE
        `;
        const resActivo = await client.query(queryActivo, [placaFormateada]);
        if (resActivo.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "No se encontró ningún vehículo estacionado con esa placa." });
        }

        const registro = resActivo.rows[0];
        const horaIngreso = new Date(registro.hora_ingreso);
        const horaSalida = new Date();
        const diferenciaMili = horaSalida - horaIngreso;
        const minutosEstadia = Math.ceil(diferenciaMili / (1000 * 60));

        // NOTA: Próximo paso evolutivo: Reemplazar estas constantes por una consulta SQL a la tabla 'Tarifas'
        const tarifaHora = registro.tipo_vehiculo === 'carro' ? 5.00 : 10.00;
        const tarifaDia = registro.tipo_vehiculo === 'carro' ? 40.00 : 80.00;

        const liquidacion = calcularMontoTarifa(minutosEstadia, tarifaHora, tarifaDia);

        await client.query(
            "UPDATE HechosEstacionamiento SET hora_salida = CURRENT_TIMESTAMP, monto_total = $1, estado = 'Finalizado' WHERE id = $2",
            [liquidacion.total, registro.registro_id]
        );

        await client.query("UPDATE EspaciosParking SET estado = 'Disponible' WHERE id = $1", [registro.espacio_id]);

        const updateTicket = `
            UPDATE TicketsEstacionamiento 
            SET fecha_salida = CURRENT_TIMESTAMP, monto_subtotal = $1, monto_igv = $2, monto_total = $3, estado_ticket = 'Pagado'
            WHERE registro_id = $4 RETURNING *
        `;
        const ticketActualizado = await client.query(updateTicket, [
            liquidacion.subtotal, liquidacion.igv, liquidacion.total, registro.registro_id
        ]);

        await client.query('COMMIT');

        res.status(200).json({
            message: "Salida registrada y procesada con éxito",
            tiempoEstadia: `${minutosEstadia} minutos`,
            detallesCobro: liquidacion,
            ticket: ticketActualizado.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error en registrarSalida:", error);
        res.status(500).json({ error: "Error interno al procesar la salida del vehículo." });
    } finally {
        client.release();
    }
}

module.exports = { registrarIngreso, registrarSalida };