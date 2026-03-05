require('dotenv').config();
const { Pool } = require('pg');

console.log('Testing Supabase Database Connection...\n');
console.log('Host:', process.env.DATABASE_URL.split('@')[1]?.split(':')[0]);
console.log('Database:', 'postgres');
console.log('User: postgres\n');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Connection FAILED:\n', err.message);
    process.exit(1);
  } else {
    console.log('✅ Connection SUCCESS!');
    console.log('Current timestamp from database:', res.rows[0].now);
    pool.end();
    process.exit(0);
  }
});
