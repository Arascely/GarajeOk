// src/config/database.js
const { Pool } = require('pg');
require('dotenv').config();

// Configuración de la base de datos usando parámetros individuales
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    ssl: {
        rejectUnauthorized: false // Obligatorio para conectar de forma segura a Neon en la nube
    }
});

pool.on('connect', () => {
    console.log('Conectado exitosamente a PostgreSQL en Neon');
});

pool.on('error', (err) => {
    console.error('Error inesperado en el pool de base de datos:', err);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};