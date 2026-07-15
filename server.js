// server.js
const express = require('express');
const { pool } = require('./src/config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

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

app.listen(PORT, () => {
    console.log(`🚀 Servidor de GarajeOk corriendo en http://localhost:${PORT}`);
});