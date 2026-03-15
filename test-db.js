#!/usr/bin/env node
/**
 * Standalone script to verify MySQL database connectivity.
 * Run with: node test-db.js
 */
require('dotenv').config();
const { testConnection } = require('./backend/db');

async function main() {
  try {
    const result = await testConnection();
    console.log('✓ Database connection successful');
    console.log('  SELECT 1 + 1 =', result.result);
    process.exit(0);
  } catch (err) {
    console.error('✗ Database connection failed:', err.message);
    process.exit(1);
  }
}

main();
