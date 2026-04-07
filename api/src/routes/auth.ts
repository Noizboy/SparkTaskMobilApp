import { Router, Request, Response } from 'express';
import { pool } from '../db';

export const authRouter = Router();

// ─── POST /api/auth/login ───────────────────────────────────────────────────
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query(
      'SELECT id, email, name, company, role FROM users WHERE email = $1 AND password = $2',
      [email, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    res.json(user);
  } catch (err: any) {
    console.error('POST /auth/login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/auth/register ────────────────────────────────────────────────
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, company } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if email already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const result = await pool.query(
      'INSERT INTO users (email, password, name, company) VALUES ($1,$2,$3,$4) RETURNING id, email, name, company, role',
      [email, password, name, company || 'SparkTask']
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error('POST /auth/register error:', err);
    res.status(500).json({ error: err.message });
  }
});
