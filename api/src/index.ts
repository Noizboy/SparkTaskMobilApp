import express from 'express';
import cors from 'cors';
import path from 'path';
import { pool } from './db';
import { ordersRouter } from './routes/orders';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { servicesRouter } from './routes/services';
import { sseHandler } from './sse';

const app = express();
const PORT = 3001;

app.use(cors());
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

  console.log('✓ Migrations applied');
}

runMigrations().catch((err) => {
  console.error('✗ Migration failed:', err.message);
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Server-Sent Events stream
app.get('/api/events', sseHandler);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/users', usersRouter);
app.use('/api/services', servicesRouter);

app.listen(PORT, () => {
  console.log(`\n🚀 SparkTask API running at http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Orders: http://localhost:${PORT}/api/orders\n`);
});
