import express from 'express';
import cors from 'cors';
import { ordersRouter } from './routes/orders';
import { authRouter } from './routes/auth';
import { sseHandler } from './sse';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Server-Sent Events stream
app.get('/api/events', sseHandler);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/orders', ordersRouter);

app.listen(PORT, () => {
  console.log(`\n🚀 SparkTask API running at http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Orders: http://localhost:${PORT}/api/orders\n`);
});
