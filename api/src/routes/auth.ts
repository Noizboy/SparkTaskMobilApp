import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../db';

export const authRouter = Router();

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'sparktask-dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';
const INVITE_EXPIRY_DAYS = 7;

// ─── Auth middleware (for protected auth routes) ──────────────────────────────
function authenticate(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ─── POST /api/auth/login ───────────────────────────────────────────────────
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query(
      'SELECT id, email, name, company, role, phone, password FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { password: _omit, ...safeUser } = user;
    const token = jwt.sign({ id: safeUser.id, role: safeUser.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ ...safeUser, token });
  } catch (err) {
    console.error('POST /auth/login error:', err);
    res.status(500).json({ error: 'Internal server error' });
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

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      'INSERT INTO users (email, password, name, company) VALUES ($1,$2,$3,$4) RETURNING id, email, name, company, role',
      [email, hashedPassword, name, company || 'SparkTask']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /auth/register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/auth/invite ────────────────────────────────────────────────────
// Authenticated (admin only) — generates a secure invite token for a new employee.
authRouter.post('/invite', authenticate, async (req: Request, res: Response) => {
  try {
    const { id: businessId, role } = (req as any).user;

    if (role !== 'admin' && role !== 'business') {
      return res.status(403).json({ error: 'Only admin accounts can invite members' });
    }

    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

    await pool.query(
      `INSERT INTO pending_invites (token, business_id, email, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE
         SET token = EXCLUDED.token,
             business_id = EXCLUDED.business_id,
             expires_at = EXCLUDED.expires_at,
             used = false`,
      [token, businessId, email, expiresAt]
    );

    const baseUrl = process.env.DASHBOARD_URL || 'http://localhost:3000';
    const inviteLink = `${baseUrl}/register?invite=${token}`;

    res.json({ token, inviteLink, email });
  } catch (err) {
    console.error('POST /auth/invite error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/auth/register-with-invite ─────────────────────────────────────
// Public — registers a new employee account using a valid invite token.
authRouter.post('/register-with-invite', async (req: Request, res: Response) => {
  try {
    const { token, email, password, name } = req.body;

    if (!token || !email || !password || !name) {
      return res.status(400).json({ error: 'token, email, password, and name are required' });
    }

    const inviteResult = await pool.query(
      `SELECT id, business_id FROM pending_invites
       WHERE token = $1 AND used = false AND expires_at > NOW()`,
      [token]
    );

    if (inviteResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired invite token' });
    }

    const invite = inviteResult.rows[0];

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO users (email, password, name, business_id, role)
       VALUES ($1, $2, $3, $4, 'cleaner')
       RETURNING id, email, name, role`,
      [email, hashedPassword, name, invite.business_id]
    );

    await pool.query('UPDATE pending_invites SET used = true WHERE id = $1', [invite.id]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /auth/register-with-invite error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
