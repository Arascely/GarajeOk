// src/config/database.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    ssl: {
        rejectUnauthorized: false // Requerido para Neon en la nube [cite: 90]
    }
});

pool.on('connect', () => {
    console.log('Conectado exitosamente a PostgreSQL en Neon'); // [cite: 91]
});

pool.on('error', (err) => {
    console.error('Error inesperado en el pool de base de datos:', err); // [cite: 92]
});

// Nota: Exportamos el pool directamente para poder usar transacciones con pool.connect()
module.exports = { pool };