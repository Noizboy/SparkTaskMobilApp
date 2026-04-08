import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db';
import { broadcast } from '../sse';

export const areasRouter = Router();

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

/** Resolve the business_id for the authenticated user (admin = own id, cleaner = business_id column). */
async function resolveBusinessId(userId: string): Promise<string | null> {
  const res = await pool.query('SELECT id, role, business_id FROM users WHERE id = $1', [userId]);
  if (res.rows.length === 0) return null;
  const user = res.rows[0];
  return user.role === 'admin' || user.role === 'business' ? user.id : user.business_id;
}

// ─── GET /api/areas — list all areas with checklist items ───────────────────
areasRouter.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const businessId = await resolveBusinessId((req as any).user.id);
    if (!businessId) return res.status(403).json({ error: 'No business associated' });

    const areasResult = await pool.query(
      'SELECT * FROM areas WHERE business_id = $1 ORDER BY name ASC',
      [businessId]
    );

    const areas = [];
    for (const row of areasResult.rows) {
      const items = await pool.query(
        'SELECT * FROM area_checklist_items WHERE area_id = $1 ORDER BY sort_order ASC',
        [row.id]
      );
      areas.push({
        id: row.id,
        businessId: row.business_id,
        name: row.name,
        description: '',
        estimatedDuration: row.estimated_duration ?? 0,
        checklist: items.rows.map((i: any) => i.text),
        createdAt: row.created_at,
      });
    }

    res.json(areas);
  } catch (err: any) {
    console.error('GET /areas error:', err.message);
    res.status(500).json({ error: 'Failed to fetch areas' });
  }
});

// ─── POST /api/areas — create area with checklist items ─────────────────────
areasRouter.post('/', authenticate, async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const businessId = await resolveBusinessId((req as any).user.id);
    if (!businessId) return res.status(403).json({ error: 'No business associated' });

    const { name, estimatedDuration, checklist } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required' });
    }
    if (!Array.isArray(checklist) || checklist.length === 0) {
      return res.status(400).json({ error: 'checklist must be a non-empty array' });
    }

    await client.query('BEGIN');

    const areaResult = await client.query(
      `INSERT INTO areas (business_id, name, estimated_duration)
       VALUES ($1, $2, $3) RETURNING *`,
      [businessId, name, estimatedDuration ?? 0]
    );
    const area = areaResult.rows[0];

    for (let i = 0; i < checklist.length; i++) {
      const text = String(checklist[i]).trim();
      if (!text) continue;
      await client.query(
        'INSERT INTO area_checklist_items (area_id, text, sort_order) VALUES ($1, $2, $3)',
        [area.id, text, i]
      );
    }

    await client.query('COMMIT');

    const items = await pool.query(
      'SELECT * FROM area_checklist_items WHERE area_id = $1 ORDER BY sort_order ASC',
      [area.id]
    );

    const result = {
      id: area.id,
      businessId: area.business_id,
      name: area.name,
      description: '',
      estimatedDuration: area.estimated_duration ?? 0,
      checklist: items.rows.map((i: any) => i.text),
      createdAt: area.created_at,
    };

    broadcast('area:created', result);
    res.status(201).json(result);
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('POST /areas error:', err.message);
    res.status(500).json({ error: 'Failed to create area' });
  } finally {
    client.release();
  }
});

// ─── PUT /api/areas/:id — update area and replace checklist items ───────────
areasRouter.put('/:id', authenticate, async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const businessId = await resolveBusinessId((req as any).user.id);
    if (!businessId) return res.status(403).json({ error: 'No business associated' });

    const { id } = req.params;
    const { name, estimatedDuration, checklist } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required' });
    }

    // Verify ownership
    const existing = await pool.query(
      'SELECT * FROM areas WHERE id = $1 AND business_id = $2',
      [id, businessId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Area not found' });
    }

    await client.query('BEGIN');

    await client.query(
      'UPDATE areas SET name = $1, estimated_duration = $2 WHERE id = $3',
      [name, estimatedDuration ?? 0, id]
    );

    // Replace checklist items
    await client.query('DELETE FROM area_checklist_items WHERE area_id = $1', [id]);

    if (Array.isArray(checklist)) {
      for (let i = 0; i < checklist.length; i++) {
        const text = String(checklist[i]).trim();
        if (!text) continue;
        await client.query(
          'INSERT INTO area_checklist_items (area_id, text, sort_order) VALUES ($1, $2, $3)',
          [id, text, i]
        );
      }
    }

    await client.query('COMMIT');

    const items = await pool.query(
      'SELECT * FROM area_checklist_items WHERE area_id = $1 ORDER BY sort_order ASC',
      [id]
    );

    const result = {
      id,
      businessId,
      name,
      description: '',
      estimatedDuration: estimatedDuration ?? 0,
      checklist: items.rows.map((i: any) => i.text),
    };

    broadcast('area:updated', result);
    res.json(result);
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('PUT /areas/:id error:', err.message);
    res.status(500).json({ error: 'Failed to update area' });
  } finally {
    client.release();
  }
});

// ─── DELETE /api/areas/:id — delete area (cascade deletes checklist items) ──
areasRouter.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const businessId = await resolveBusinessId((req as any).user.id);
    if (!businessId) return res.status(403).json({ error: 'No business associated' });

    const { id } = req.params;

    const existing = await pool.query(
      'SELECT * FROM areas WHERE id = $1 AND business_id = $2',
      [id, businessId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Area not found' });
    }

    await pool.query('DELETE FROM areas WHERE id = $1', [id]);

    broadcast('area:deleted', { id });
    res.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /areas/:id error:', err.message);
    res.status(500).json({ error: 'Failed to delete area' });
  }
});
