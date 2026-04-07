import { Pool } from 'pg';

export const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'sparktask',
  user: 'postgres',
  // No password needed — pg_hba.conf is set to trust for local connections
});

// Test connection on startup
pool.query('SELECT NOW()').then(() => {
  console.log('✓ PostgreSQL connected — sparktask database');
}).catch((err) => {
  console.error('✗ PostgreSQL connection failed:', err.message);
  process.exit(1);
});
