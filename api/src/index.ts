import express from 'express';
import cors from 'cors';
import path from 'path';
import { pool } from './db';
import { ordersRouter } from './routes/orders';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { servicesRouter } from './routes/services';
import { areasRouter } from './routes/areas';
import { sseHandler } from './sse';

const app = express();
const PORT = 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Startup migrations ───────────────────────────────────────────────────────
async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pending_invites (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      token       TEXT NOT NULL UNIQUE,
      business_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      email       TEXT NOT NULL UNIQUE,
      expires_at  TIMESTAMPTZ NOT NULL,
      used        BOOLEAN NOT NULL DEFAULT false,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS services (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name        VARCHAR(255) NOT NULL,
      description TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS areas (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID NOT NULL REFERENCES users(id),
      name VARCHAR(255) NOT NULL,
      estimated_duration INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS area_checklist_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      area_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
      text VARCHAR(255) NOT NULL,
      sort_order INT DEFAULT 0
    )
  `);

  // Ensure photos table exists — stores before/after photos per section
  await pool.query(`
    CREATE TABLE IF NOT EXISTS photos (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
      type       VARCHAR(10) NOT NULL CHECK (type IN ('before', 'after')),
      url        TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Add updated_at to orders table for optimistic locking
  await pool.query(`
    DO $$ BEGIN
      ALTER TABLE orders ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$
  `);

  // Add company-related columns to users table
  const companyColumns = [
    { name: 'company_phone', type: 'VARCHAR(50)' },
    { name: 'address', type: 'TEXT' },
    { name: 'city', type: 'VARCHAR(255)' },
    { name: 'zip_code', type: 'VARCHAR(20)' },
  ];
  for (const col of companyColumns) {
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE users ADD COLUMN ${col.name} ${col.type};
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$
    `);
  }

  console.log('✓ Migrations applied');
}

runMigrations().catch((err) => {
  console.error('✗ Migration failed:', err.message);
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public app info — exposes only APP_VERSION, no auth required
app.get('/api/info', (_req, res) => {
  res.json({ version: process.env.APP_VERSION ?? '0.1.0' });
});

// Server-Sent Events stream
app.get('/api/events', sseHandler);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/users', usersRouter);
app.use('/api/services', servicesRouter);
app.use('/api/areas', areasRouter);

app.listen(PORT, () => {
  console.log(`\n🚀 SparkTask API running at http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Orders: http://localhost:${PORT}/api/orders\n`);
});
