// server.js
const express = require('express');
const { pool } = require('./src/config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Importar rutas de autenticación
const authRoutes = require('./src/routes/auth.routes');
const parkingRoutes = require('./src/routes/parking.routes');

//Ruteador de Express para manejar las rutas de autenticación y de parking
app.use('/api/auth', authRoutes);
app.use('/api/parking', parkingRoutes);

// Ruta de diagnóstico simple
app.get('/test-db', async (req, res) => {
    const { pool } = require('./src/config/database');
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ message: "¡Conexión exitosa a PostgreSQL!", time: result.rows[0].now });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/health', async (req, res) => {
    const { pool } = require('./src/config/database');
    try {
        await pool.query('SELECT 1');
        res.status(200).json({ status: "UP", database: "CONNECTED", timestamp: new Date() });
    } catch (err) {
        res.status(500).json({ status: "DOWN", database: "DISCONNECTED", error: err.message });
    }
}); 

const listEndpoints = require('express-list-endpoints');
console.log(listEndpoints(app));

app.listen(PORT, () => {
    console.log(`Servidor de GarajeOk corriendo en http://localhost:${PORT}`);
});

