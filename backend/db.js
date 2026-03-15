require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'twitter_clone',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Verifies the database connection by running a simple query.
 * @returns {Promise<{success: boolean, result?: number}>} Result object on success
 * @throws {Error} On connection or query failure
 */
async function testConnection() {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    return { success: true, result: rows[0].result };
  } catch (err) {
    throw err;
  }
}

module.exports = { pool, testConnection };
