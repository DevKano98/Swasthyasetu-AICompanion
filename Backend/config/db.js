// db.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,       // localhost
  user: process.env.DB_USER,       // postgres
  password: process.env.DB_PASS,   // dev
  database: process.env.DB_NAME,   // ai_companion
  port: 5432,                      // default PostgreSQL port
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('Unexpected PG client error', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
};
