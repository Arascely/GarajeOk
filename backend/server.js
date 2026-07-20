// backend/server.js
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./src/config/openapi.json');
const { pool } = require('./src/config/database');
const listEndpoints = require('express-list-endpoints');
require('dotenv').config();

const authRoutes = require('./src/routes/auth.routes');
const parkingRoutes = require('./src/routes/parking.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// 📝 Middleware de OpenSpec para contratos de datos de la API
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.json());

// Enrutadores modulares del ecosistema SaaS Multi-Tenant
app.use('/api/auth', authRoutes);
app.use('/api/parking', parkingRoutes);

// Endpoint de diagnóstico de salud para el pool de Neon
app.get('/api/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ message: "¡Conexión exitosa a PostgreSQL en Neon!", time: result.rows[0].now });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint de Health Check requerido para monitoreo en producción
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.status(200).json({ status: "UP", database: "CONNECTED", timestamp: new Date() });
    } catch (err) {
        res.status(500).json({ status: "DOWN", database: "DISCONNECTED", error: err.message });
    }
});

// Imprimir mapeo de endpoints en la consola de desarrollo
console.log("Endpoints registrados en el Gateway:");
console.log(listEndpoints(app));

app.listen(PORT, () => {
    console.log(`\n🚀 Servidor Core SaaS corriendo en http://localhost:${PORT}`);
    console.log(`📝 Documentación OpenSpec disponible en http://localhost:${PORT}/api-docs\n`);
});

module.exports = app;