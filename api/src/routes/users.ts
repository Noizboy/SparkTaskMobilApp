import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { pool } from '../db';

export const usersRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'sparktask-dev-secret-change-in-production';

// ─── Auth middleware ────────────────────────────────────────────────────────
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

const uploadsDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ─── POST /api/users/link ────────────────────────────────────────────────────
// Authenticated (admin only) — links an existing employee account to this business.
usersRouter.post('/link', authenticate, async (req: Request, res: Response) => {
  try {
    const { id: businessId, role } = (req as any).user;

    if (role !== 'admin' && role !== 'business') {
      return res.status(403).json({ error: 'Only admin accounts can link members' });
    }

    const { employee_email } = req.body;
    if (!employee_email || typeof employee_email !== 'string') {
      return res.status(400).json({ error: 'employee_email is required' });
    }

    // First check if the email exists at all to give a specific error
    const normalizedEmail = employee_email.trim().toLowerCase();
    const existing = await pool.query(
      `SELECT id, role, business_id FROM users WHERE LOWER(email) = $1`,
      [normalizedEmail]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'No account found with that email address' });
    }

    const target = existing.rows[0];

    if (target.role === 'admin' || target.role === 'business') {
      return res.status(400).json({ error: 'Cannot link an admin or business account as a member' });
    }

    if (target.business_id !== null) {
      return res.status(409).json({ error: 'This member is already linked to a business' });
    }

    const result = await pool.query(
      `UPDATE users
       SET business_id = $1
       WHERE id = $2 AND business_id IS NULL
       RETURNING id, email, name, role, phone, avatar_url`,
      [businessId, target.id]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ error: 'This member is already linked to a business' });
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('POST /users/link error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/users/team ────────────────────────────────────────────────────
// Returns all employees linked to the authenticated business account.
usersRouter.get('/team', authenticate, async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user.id;

    const result = await pool.query(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.role,
         u.phone,
         u.avatar_url,
         u.created_at,
         COALESCE(completed.count, 0)::int AS orders_completed
       FROM users u
       LEFT JOIN (
         SELECT ae.employee_name, COUNT(o.id) AS count
         FROM assigned_employees ae
         JOIN orders o ON o.id = ae.order_id AND o.status = 'completed'
         GROUP BY ae.employee_name
       ) completed ON completed.employee_name = u.name
       WHERE u.business_id = $1
       ORDER BY u.name ASC`,
      [businessId]
    );

    res.json(result.rows);
  } catch (err: any) {
    console.error('GET /users/team error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/users ─────────────────────────────────────────────────────────
usersRouter.get('/', authenticate, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT
         u.id, u.name, u.email, u.role, u.phone, u.avatar_url, u.created_at,
         COALESCE(completed.count, 0)::int AS orders_completed
       FROM users u
       LEFT JOIN (
         SELECT ae.employee_name, COUNT(o.id) AS count
         FROM assigned_employees ae
         JOIN orders o ON o.id = ae.order_id AND o.status = 'completed'
         GROUP BY ae.employee_name
       ) completed ON completed.employee_name = u.name
       ORDER BY u.name ASC`
    );
    res.json(result.rows);
  } catch (err: any) {
    console.error('GET /users error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/users/me ────────────────────────────────────────────────────
// Authenticated — updates the current user's own profile using the JWT's user ID.
// This avoids stale-ID issues when the DB is re-seeded.
usersRouter.patch('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const id = (req as any).user.id;
    const { name, phone, role, company, company_phone, address, city, zip_code } = req.body;

    if (role !== undefined && role !== null) {
      const allowedRoles = ['cleaner', 'supervisor'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ error: `Invalid role. Allowed values: ${allowedRoles.join(', ')}` });
      }
    }

    const result = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           role = COALESCE($3, role),
           company = COALESCE($4, company),
           company_phone = COALESCE($5, company_phone),
           address = COALESCE($6, address),
           city = COALESCE($7, city),
           zip_code = COALESCE($8, zip_code)
       WHERE id = $9
       RETURNING id, email, name, company, role, phone, avatar_url, company_phone, address, city, zip_code`,
      [name ?? null, phone ?? null, role ?? null, company ?? null, company_phone ?? null, address ?? null, city ?? null, zip_code ?? null, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('PATCH /users/me error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/users/me/avatar ──────────────────────────────────────────────
// Authenticated — uploads avatar for the current user using JWT's user ID.
usersRouter.post('/me/avatar', authenticate, upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    const id = (req as any).user.id;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const existing = await pool.query(`SELECT avatar_url FROM users WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'User not found' });
    }

    const oldAvatarUrl: string | null = existing.rows[0].avatar_url;
    if (oldAvatarUrl) {
      const oldFilename = oldAvatarUrl.split('/uploads/avatars/').pop();
      if (oldFilename) {
        const oldPath = path.join(uploadsDir, oldFilename);
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch { /* ignore if already gone */ }
        }
      }
    }

    const host = req.get('host') || 'localhost:3001';
    const protocol = req.protocol || 'http';
    const avatarUrl = `${protocol}://${host}/uploads/avatars/${req.file.filename}`;

    const result = await pool.query(
      `UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, email, name, company, role, phone, avatar_url`,
      [avatarUrl, id]
    );

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('POST /users/me/avatar error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/users/:id ───────────────────────────────────────────────────
usersRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phone, role, company, company_phone, address, city, zip_code } = req.body;

    // Validate role if provided
    if (role !== undefined && role !== null) {
      const allowedRoles = ['cleaner', 'supervisor'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ error: `Invalid role. Allowed values: ${allowedRoles.join(', ')}` });
      }
    }

    const result = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           role = COALESCE($3, role),
           company = COALESCE($4, company),
           company_phone = COALESCE($5, company_phone),
           address = COALESCE($6, address),
           city = COALESCE($7, city),
           zip_code = COALESCE($8, zip_code)
       WHERE id = $9
       RETURNING id, email, name, company, role, phone, avatar_url, company_phone, address, city, zip_code`,
      [name ?? null, phone ?? null, role ?? null, company ?? null, company_phone ?? null, address ?? null, city ?? null, zip_code ?? null, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('PATCH /users/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/users/:id ──────────────────────────────────────────────────
// Unlinks an employee from the business (sets business_id to NULL) instead of
// deleting the user row, so the account can be re-linked later.
usersRouter.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user.id;
    const { id } = req.params;

    // Only allow unlinking employees that belong to this business account
    const result = await pool.query(
      'UPDATE users SET business_id = NULL WHERE id = $1 AND business_id = $2 RETURNING id',
      [id, businessId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found or not authorized' });
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /users/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/users/:id/avatar ─────────────────────────────────────────────
usersRouter.post('/:id/avatar', upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Fetch existing avatar_url to delete old file
    const existing = await pool.query(`SELECT avatar_url FROM users WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      fs.unlinkSync(req.file.path); // clean up uploaded file
      return res.status(404).json({ error: 'User not found' });
    }

    const oldAvatarUrl: string | null = existing.rows[0].avatar_url;
    if (oldAvatarUrl) {
      const oldFilename = oldAvatarUrl.split('/uploads/avatars/').pop();
      if (oldFilename) {
        const oldPath = path.join(uploadsDir, oldFilename);
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch { /* ignore if already gone */ }
        }
      }
    }

    const host = req.get('host') || 'localhost:3001';
    const protocol = req.protocol || 'http';
    const avatarUrl = `${protocol}://${host}/uploads/avatars/${req.file.filename}`;

    const result = await pool.query(
      `UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, email, name, company, role, phone, avatar_url`,
      [avatarUrl, id]
    );

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('POST /users/:id/avatar error:', err);
    res.status(500).json({ error: err.message });
  }
});
