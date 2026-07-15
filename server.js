// server.js
const express = require('express');
const { pool } = require('./src/config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Ruta de prueba rápida para verificar que el servidor y la BD se comunican
app.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({
            message: "¡Conexión exitosa a PostgreSQL!",
            time: result.rows[0].now
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "No se pudo conectar a la base de datos", details: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de GarajeOk corriendo en http://localhost:${PORT}`);
});