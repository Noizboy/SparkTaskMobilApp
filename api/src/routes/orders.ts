import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { pool } from '../db';
import { broadcast, broadcastToUsers } from '../sse';
import { createNotificationForUser } from './notifications';

export const ordersRouter = Router();

// ─── JWT auth (mirrors users.ts — photos require authentication) ─────────────
const JWT_SECRET = process.env.JWT_SECRET || 'sparktask-dev-secret-change-in-production';

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

// ─── Multer — photo uploads ──────────────────────────────────────────────────
const photosUploadDir = path.join(__dirname, '../../uploads/photos');
if (!fs.existsSync(photosUploadDir)) fs.mkdirSync(photosUploadDir, { recursive: true });

const photoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, photosUploadDir),
  filename: (_req, _file, cb) => {
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`);
  },
});

const photoUpload = multer({
  storage: photoStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// ─── Helper: build full order object from DB rows ───────────────────────────
async function buildFullOrder(orderId: string) {
  const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
  if (orderRes.rows.length === 0) return null;

  const order = orderRes.rows[0];

  const sectionsRes = await pool.query(
    'SELECT * FROM sections WHERE order_id = $1 ORDER BY sort_order',
    [orderId]
  );

  const sections = await Promise.all(
    sectionsRes.rows.map(async (section) => {
      const todosRes = await pool.query(
        'SELECT * FROM todos WHERE section_id = $1 ORDER BY sort_order',
        [section.id]
      );
      const photosRes = await pool.query(
        'SELECT * FROM photos WHERE section_id = $1 ORDER BY created_at',
        [section.id]
      );

      return {
        id: section.id,
        name: section.name,
        icon: section.icon,
        completed: section.completed,
        skipReason: section.skip_reason,
        estimatedTime: section.estimated_time,
        beforePhotos: photosRes.rows.filter(p => p.type === 'before').map(p => p.url),
        afterPhotos: photosRes.rows.filter(p => p.type === 'after').map(p => p.url),
        todos: todosRes.rows.map(t => ({
          id: t.id,
          text: t.text,
          completed: t.completed,
        })),
      };
    })
  );

  const addOnsRes = await pool.query(
    'SELECT * FROM add_ons WHERE order_id = $1',
    [orderId]
  );

  const employeesRes = await pool.query(
    'SELECT employee_name FROM assigned_employees WHERE order_id = $1',
    [orderId]
  );

  return {
    id: order.id,
    orderNumber: order.order_number,
    clientName: order.client_name,
    clientEmail: order.client_email,
    address: order.address,
    phone: order.phone,
    status: order.status,
    date: order.date.toISOString().split('T')[0], // YYYY-MM-DD
    time: order.time,
    serviceType: order.service_type,
    duration: order.duration,
    specialInstructions: order.special_instructions,
    accessInfo: order.access_info,
    goal: order.goal,
    startedAt: order.started_at ? Number(order.started_at) : undefined,
    completedAt: order.completed_at ? Number(order.completed_at) : undefined,
    updatedAt: order.updated_at ? (order.updated_at as Date).toISOString() : null,
    assignedEmployees: employeesRes.rows.map(r => r.employee_name),
    sections,
    addOns: addOnsRes.rows.map(a => ({
      id: a.id,
      name: a.name,
      icon: a.icon,
      price: a.price ? Number(a.price) : undefined,
      selected: a.selected,
      skipReason: a.skip_reason,
    })),
  };
}

// ─── GET /api/orders — list all orders (with optional filters) ──────────────
ordersRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { status, from, to, search, employee } = req.query;

    let query = 'SELECT id FROM orders WHERE 1=1';
    const params: any[] = [];
    let idx = 1;

    if (status && status !== 'all') {
      query += ` AND status = $${idx++}`;
      params.push(status);
    }
    if (from) {
      query += ` AND date >= $${idx++}`;
      params.push(from);
    }
    if (to) {
      query += ` AND date <= $${idx++}`;
      params.push(to);
    }
    if (search) {
      query += ` AND (order_number ILIKE $${idx} OR client_name ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }
    if (employee) {
      query += ` AND id IN (SELECT order_id FROM assigned_employees WHERE employee_name = $${idx++})`;
      params.push(employee);
    }

    query += ' ORDER BY date DESC, time ASC';

    const result = await pool.query(query, params);
    const orders = await Promise.all(
      result.rows.map(r => buildFullOrder(r.id))
    );

    res.json(orders);
  } catch (err: any) {
    console.error('GET /orders error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/orders/:id — single order detail ─────────────────────────────
ordersRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const order = await buildFullOrder(req.params.id as string);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err: any) {
    console.error('GET /orders/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/orders — create a new order ──────────────────────────────────
ordersRouter.post('/', async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      orderNumber, clientName, clientEmail, address, phone,
      date, time, serviceType,
      specialInstructions, accessInfo, goal,
      sections = [], addOns = [], assignedEmployees = [],
    } = req.body;

    // Auto-calculate duration from sections estimatedTime sum
    const totalMinutes: number = sections.reduce((sum: number, s: any) => sum + (Number(s.estimatedTime) || 0), 0);
    const duration = totalMinutes <= 0 ? '' : (() => { const h = Math.floor(totalMinutes / 60); const m = totalMinutes % 60; return h > 0 && m > 0 ? `${h} ${h === 1 ? 'hour' : 'hours'} ${m} min` : h > 0 ? `${h} ${h === 1 ? 'hour' : 'hours'}` : `${m} min`; })();

    // Generate order number if not provided
    const finalOrderNumber = orderNumber || `#${Math.floor(10000 + Math.random() * 90000)}`;

    const orderRes = await client.query(
      `INSERT INTO orders (order_number, client_name, client_email, address, phone, date, time, service_type, duration, special_instructions, access_info, goal)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id`,
      [finalOrderNumber, clientName, clientEmail, address, phone, date, time, serviceType, duration, specialInstructions, accessInfo, goal]
    );

    const orderId = orderRes.rows[0].id;

    // Insert sections + todos
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      const sectionRes = await client.query(
        `INSERT INTO sections (order_id, name, icon, estimated_time, sort_order)
         VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [orderId, s.name, s.icon || 'Sparkles', s.estimatedTime, i]
      );
      const sectionId = sectionRes.rows[0].id;

      if (s.todos) {
        for (let j = 0; j < s.todos.length; j++) {
          await client.query(
            `INSERT INTO todos (section_id, text, sort_order) VALUES ($1,$2,$3)`,
            [sectionId, s.todos[j].text, j]
          );
        }
      }
    }

    // Insert add-ons
    for (const addon of addOns) {
      await client.query(
        `INSERT INTO add_ons (order_id, name, icon, price, selected) VALUES ($1,$2,$3,$4,$5)`,
        [orderId, addon.name, addon.icon || 'Sparkles', addon.price, addon.selected ?? true]
      );
    }

    // Check schedule conflicts before inserting employees
    if (assignedEmployees.length > 0) {
      const scheduleCheck = await checkScheduleConflict(null, assignedEmployees, date, time, duration, client);
      if (scheduleCheck.conflict) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: `Schedule conflict: ${scheduleCheck.cleanerName} is already assigned to order ${scheduleCheck.orderNumber} at ${scheduleCheck.conflictTime} on this date. Please choose a different time or assign a different team member.`,
          type: 'schedule_conflict',
        });
      }
    }

    // Insert assigned employees
    for (const emp of assignedEmployees) {
      await client.query(
        `INSERT INTO assigned_employees (order_id, employee_name) VALUES ($1,$2)`,
        [orderId, emp]
      );
    }

    await client.query('COMMIT');

    const fullOrder = await buildFullOrder(orderId);
    broadcast('order:created', fullOrder);
    res.status(201).json(fullOrder);
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('POST /orders error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─── PUT /api/orders/:id — full update ──────────────────────────────────────
ordersRouter.put('/:id', async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orderId = req.params.id as string;

    // Lock the order row and apply optimistic lock check (Fix 3)
    const lockRes = await client.query(
      'SELECT id, duration, date, time, updated_at FROM orders WHERE id = $1 FOR UPDATE',
      [orderId]
    );
    if (lockRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }

    const {
      orderNumber, clientName, clientEmail, address, phone,
      status, date, time, serviceType,
      specialInstructions, accessInfo, goal,
      startedAt, completedAt,
      sections, addOns, assignedEmployees,
      clientUpdatedAt,
      deletedPhotos = [] as string[],
    } = req.body;

    // Optimistic lock check
    if (clientUpdatedAt != null) {
      const serverTs = lockRes.rows[0].updated_at as Date | null;
      if (serverTs && new Date(serverTs) > new Date(clientUpdatedAt)) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'conflict', serverUpdatedAt: serverTs.toISOString() });
      }
    }

    // Auto-calculate duration from sections if provided, otherwise keep existing
    const totalMinutes: number = sections ? sections.reduce((sum: number, s: any) => sum + (Number(s.estimatedTime) || 0), 0) : 0;
    const duration: string = sections
      ? (totalMinutes <= 0 ? '' : (() => { const h = Math.floor(totalMinutes / 60); const m = totalMinutes % 60; return h > 0 && m > 0 ? `${h} ${h === 1 ? 'hour' : 'hours'} ${m} min` : h > 0 ? `${h} ${h === 1 ? 'hour' : 'hours'}` : `${m} min`; })())
      : (lockRes.rows[0].duration ?? '');

    // Enforce: a cleaner cannot have more than 1 in-progress order
    if (status === 'in-progress') {
      const check = await checkCleanerInProgressConflict(orderId, client);
      if (check.conflict) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: `${check.cleanerName} already has an in-progress order (${check.orderNumber}). A cleaner cannot have more than one in-progress order at a time.`
        });
      }
    }

    await client.query(
      `UPDATE orders SET
        order_number=$1, client_name=$2, client_email=$3, address=$4, phone=$5,
        status=$6, date=$7, time=$8, service_type=$9, duration=$10,
        special_instructions=$11, access_info=$12, goal=$13,
        started_at=$14, completed_at=$15, updated_at=NOW()
       WHERE id=$16`,
      [orderNumber, clientName, clientEmail, address, phone,
       status, date, time, serviceType, duration,
       specialInstructions, accessInfo, goal,
       startedAt == null ? null : typeof startedAt === 'number' ? startedAt : new Date(startedAt).getTime(),
       completedAt == null ? null : typeof completedAt === 'number' ? completedAt : new Date(completedAt).getTime(),
       orderId]
    );

    // Upsert sections (Fix 4) — preserves concurrent work, no destructive DELETE
    if (sections) {
      for (let i = 0; i < sections.length; i++) {
        const s = sections[i];
        let sectionId: string;

        if (s.id) {
          // UPSERT existing section by stable ID
          const sectionRes = await client.query(
            `INSERT INTO sections (id, order_id, name, icon, completed, skip_reason, estimated_time, sort_order)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
             ON CONFLICT (id) DO UPDATE SET
               name=EXCLUDED.name, icon=EXCLUDED.icon, completed=EXCLUDED.completed,
               skip_reason=EXCLUDED.skip_reason, estimated_time=EXCLUDED.estimated_time,
               sort_order=EXCLUDED.sort_order
             RETURNING id`,
            [s.id, orderId, s.name, s.icon || 'Sparkles', s.completed || false, s.skipReason ?? null, s.estimatedTime, i]
          );
          sectionId = sectionRes.rows[0].id;
        } else {
          // New section — INSERT and let DB generate a UUID
          const sectionRes = await client.query(
            `INSERT INTO sections (order_id, name, icon, completed, skip_reason, estimated_time, sort_order)
             VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
            [orderId, s.name, s.icon || 'Sparkles', s.completed || false, s.skipReason ?? null, s.estimatedTime, i]
          );
          sectionId = sectionRes.rows[0].id;
        }

        // Upsert todos for this section
        if (s.todos) {
          for (let j = 0; j < s.todos.length; j++) {
            const t = s.todos[j];
            if (t.id) {
              await client.query(
                `INSERT INTO todos (id, section_id, text, completed, sort_order)
                 VALUES ($1,$2,$3,$4,$5)
                 ON CONFLICT (id) DO UPDATE SET
                   text=EXCLUDED.text, completed=EXCLUDED.completed, sort_order=EXCLUDED.sort_order`,
                [t.id, sectionId, t.text, t.completed || false, j]
              );
            } else {
              await client.query(
                `INSERT INTO todos (section_id, text, completed, sort_order) VALUES ($1,$2,$3,$4)`,
                [sectionId, t.text, t.completed || false, j]
              );
            }
          }
        }

        // Photos: only insert URLs not already present; never bulk-delete (Fix 4)
        if (s.beforePhotos) {
          for (const url of s.beforePhotos) {
            await client.query(
              `INSERT INTO photos (section_id, type, url)
               SELECT $1, 'before', $2
               WHERE NOT EXISTS (SELECT 1 FROM photos WHERE section_id = $1 AND url = $2)`,
              [sectionId, url]
            );
          }
        }
        if (s.afterPhotos) {
          for (const url of s.afterPhotos) {
            await client.query(
              `INSERT INTO photos (section_id, type, url)
               SELECT $1, 'after', $2
               WHERE NOT EXISTS (SELECT 1 FROM photos WHERE section_id = $1 AND url = $2)`,
              [sectionId, url]
            );
          }
        }
      }

      // Delete only photos explicitly marked for deletion (Fix 4)
      for (const photoUrl of deletedPhotos) {
        const delRes = await client.query(
          `DELETE FROM photos
           WHERE section_id IN (SELECT id FROM sections WHERE order_id = $1)
             AND url = $2
           RETURNING url`,
          [orderId, photoUrl]
        );
        if (delRes.rows.length > 0) {
          const filename = (photoUrl as string).split('/uploads/photos/').pop();
          if (filename) {
            const filePath = path.join(photosUploadDir, filename);
            if (fs.existsSync(filePath)) {
              try { fs.unlinkSync(filePath); } catch { /* ignore stale files */ }
            }
          }
        }
      }
    }

    // Replace add-ons if provided
    if (addOns) {
      await client.query('DELETE FROM add_ons WHERE order_id = $1', [orderId]);
      for (const addon of addOns) {
        await client.query(
          `INSERT INTO add_ons (order_id, name, icon, price, selected, skip_reason) VALUES ($1,$2,$3,$4,$5,$6)`,
          [orderId, addon.name, addon.icon || 'Sparkles', addon.price, addon.selected ?? true, addon.skipReason]
        );
      }
    }

    // Replace employees if provided — check schedule conflicts first
    let previousEmployees: string[] = [];
    if (assignedEmployees) {
      // Capture current employees before replacing, for assignment diff
      const prevRes = await client.query(
        'SELECT employee_name FROM assigned_employees WHERE order_id = $1',
        [orderId]
      );
      previousEmployees = prevRes.rows.map((r: any) => r.employee_name as string);

      // Use updated date/time/duration for conflict check
      const checkDate = date ?? lockRes.rows[0].date;
      const checkTime = time ?? lockRes.rows[0].time;
      const checkDuration = duration || lockRes.rows[0].duration;

      if (assignedEmployees.length > 0) {
        const scheduleCheck = await checkScheduleConflict(orderId, assignedEmployees, checkDate, checkTime, checkDuration, client);
        if (scheduleCheck.conflict) {
          await client.query('ROLLBACK');
          return res.status(409).json({
            error: `Schedule conflict: ${scheduleCheck.cleanerName} is already assigned to order ${scheduleCheck.orderNumber} at ${scheduleCheck.conflictTime} on this date. Please choose a different time or assign a different team member.`,
            type: 'schedule_conflict',
          });
        }
      }

      await client.query('DELETE FROM assigned_employees WHERE order_id = $1', [orderId]);
      for (const emp of assignedEmployees) {
        await client.query(
          `INSERT INTO assigned_employees (order_id, employee_name) VALUES ($1,$2)`,
          [orderId, emp]
        );
      }
    }

    await client.query('COMMIT');

    const fullOrder = await buildFullOrder(orderId);
    broadcast('order:updated', fullOrder);

    // Emit targeted assignment notifications if employees changed
    if (assignedEmployees) {
      const newSet = new Set<string>(assignedEmployees as string[]);
      const oldSet = new Set<string>(previousEmployees);
      const added = (assignedEmployees as string[]).filter((e) => !oldSet.has(e));
      const removed = previousEmployees.filter((e) => !newSet.has(e));

      if (added.length > 0) {
        const addedRes = await pool.query(
          `SELECT id FROM users WHERE name = ANY($1)`,
          [added]
        );
        const addedIds = addedRes.rows.map((r: any) => r.id as string);
        if (addedIds.length > 0) {
          broadcastToUsers('order:assigned', fullOrder, addedIds);
          // Persist notification in DB for each added cleaner
          const assignedDate = fullOrder?.date
            ? new Date(fullOrder.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
            : null;
          const assignedTime = fullOrder?.time ?? null;
          const assignedDetail = [assignedDate, assignedTime].filter(Boolean).join(' at ');
          await Promise.all(
            addedIds.map((uid) =>
              createNotificationForUser(
                uid,
                'assigned',
                'New Job Assigned',
                `Order #${fullOrder?.orderNumber}${assignedDetail ? ` — ${assignedDetail}` : ''} has been added to your schedule.`
              )
            )
          );
        }
      }

      if (removed.length > 0) {
        const removedRes = await pool.query(
          `SELECT id FROM users WHERE name = ANY($1)`,
          [removed]
        );
        const removedIds = removedRes.rows.map((r: any) => r.id as string);
        if (removedIds.length > 0) {
          broadcastToUsers('order:unassigned', { id: orderId, orderNumber: fullOrder?.orderNumber }, removedIds);
          // Persist notification in DB for each removed cleaner
          await Promise.all(
            removedIds.map((uid) =>
              createNotificationForUser(
                uid,
                'removed',
                'Schedule Update',
                `You've been removed from Order #${fullOrder?.orderNumber}. Check your schedule for any changes.`
              )
            )
          );
        }
      }
    }

    res.json(fullOrder);
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('PUT /orders/:id error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─── Helper: parse "9:00 AM" or "14:30" → minutes since midnight ─────────────
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const upper = timeStr.trim().toUpperCase();
  const ampm = upper.includes('AM') || upper.includes('PM');
  if (ampm) {
    const [timePart, period] = upper.split(/\s+/);
    const [hStr, mStr = '0'] = timePart.split(':');
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }
  const [hStr, mStr = '0'] = upper.split(':');
  return parseInt(hStr, 10) * 60 + parseInt(mStr, 10);
}

// ─── Helper: parse "2 hours 30 min" / "90 min" / "2 hours" → minutes ─────────
function parseDurationToMinutes(durationStr: string): number {
  if (!durationStr) return 0;
  let total = 0;
  const hourMatch = durationStr.match(/(\d+)\s*hour/i);
  const minMatch = durationStr.match(/(\d+)\s*min/i);
  if (hourMatch) total += parseInt(hourMatch[1], 10) * 60;
  if (minMatch) total += parseInt(minMatch[1], 10);
  return total || 60; // default 60 min if unparseable
}

// ─── Helper: check schedule conflicts for a set of employees ─────────────────
// Returns the first conflict found or null.
async function checkScheduleConflict(
  orderId: string | null, // null when creating a new order
  employees: string[],
  date: string,
  time: string,
  durationStr: string,
  db: any = pool
): Promise<{ conflict: true; cleanerName: string; orderNumber: string; conflictTime: string } | { conflict: false }> {
  if (!employees.length || !date || !time) return { conflict: false };

  const startMin = parseTimeToMinutes(time);
  const durationMin = parseDurationToMinutes(durationStr);
  const endMin = startMin + durationMin;

  for (const emp of employees) {
    // Find all scheduled/in-progress orders on the same date assigned to this employee
    const result = await db.query(
      `SELECT o.id, o.order_number, o.time, o.duration
       FROM orders o
       JOIN assigned_employees ae ON ae.order_id = o.id
       WHERE ae.employee_name = $1
         AND o.date = $2
         AND o.status IN ('scheduled', 'in-progress')
         ${orderId ? 'AND o.id <> $3' : ''}`,
      orderId ? [emp, date, orderId] : [emp, date]
    );

    for (const row of result.rows) {
      const otherStart = parseTimeToMinutes(row.time || '');
      const otherDuration = parseDurationToMinutes(row.duration || '');
      const otherEnd = otherStart + otherDuration;

      // Overlap: new order starts before other ends AND new order ends after other starts
      const overlaps = startMin < otherEnd && endMin > otherStart;
      if (overlaps) {
        return {
          conflict: true,
          cleanerName: emp,
          orderNumber: row.order_number,
          conflictTime: `${row.time}${row.duration ? ` (${row.duration})` : ''}`,
        };
      }
    }
  }
  return { conflict: false };
}

// ─── Helper: check if any assigned cleaner already has an in-progress order ──
async function checkCleanerInProgressConflict(
  orderId: string,
  client?: any // pg PoolClient; falls back to pool
): Promise<{ conflict: true; cleanerName: string; orderNumber: string } | { conflict: false }> {
  const db = client || pool;
  const result = await db.query(
    `SELECT ae.employee_name, o.order_number
     FROM assigned_employees ae
     JOIN assigned_employees ae2 ON ae.employee_name = ae2.employee_name
     JOIN orders o ON ae2.order_id = o.id
     WHERE ae.order_id = $1
       AND ae2.order_id <> $1
       AND o.status = 'in-progress'
     LIMIT 1`,
    [orderId]
  );
  if (result.rows.length > 0) {
    return { conflict: true, cleanerName: result.rows[0].employee_name, orderNumber: result.rows[0].order_number };
  }
  return { conflict: false };
}

// ─── PATCH /api/orders/:id/status — change status only ─────────────────────
ordersRouter.patch('/:id/status', async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the order row — serializes concurrent status changes on the same order
    const lockRes = await client.query(
      'SELECT id, updated_at FROM orders WHERE id = $1 FOR UPDATE',
      [req.params.id]
    );
    if (lockRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }

    const { status, startedAt, completedAt, clientUpdatedAt } = req.body;

    // Optimistic lock check (Fix 3)
    if (clientUpdatedAt != null) {
      const serverTs = lockRes.rows[0].updated_at as Date | null;
      if (serverTs && new Date(serverTs) > new Date(clientUpdatedAt)) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'conflict', serverUpdatedAt: serverTs.toISOString() });
      }
    }

    const toMs = (v: any) => v == null ? null : typeof v === 'number' ? v : new Date(v).getTime();

    // Enforce: a cleaner cannot have more than 1 in-progress order
    if (status === 'in-progress') {
      const check = await checkCleanerInProgressConflict(req.params.id as string, client);
      if (check.conflict) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: `${check.cleanerName} already has an in-progress order (${check.orderNumber}). A cleaner cannot have more than one in-progress order at a time.`
        });
      }
    }

    await client.query(
      `UPDATE orders SET status=$1, started_at=COALESCE($2, started_at), completed_at=COALESCE($3, completed_at), updated_at=NOW() WHERE id=$4`,
      [status, toMs(startedAt), toMs(completedAt), req.params.id]
    );

    // Reset all progress when reverting to scheduled
    if (status === 'scheduled') {
      const sectionsRes = await client.query('SELECT id FROM sections WHERE order_id = $1', [req.params.id]);
      for (const section of sectionsRes.rows) {
        await client.query('UPDATE todos SET completed = false WHERE section_id = $1', [section.id]);
        await client.query('DELETE FROM photos WHERE section_id = $1', [section.id]);
      }
      await client.query('UPDATE sections SET completed = false, skip_reason = NULL WHERE order_id = $1', [req.params.id]);
      await client.query('UPDATE add_ons SET selected = false WHERE order_id = $1', [req.params.id]);
      await client.query('UPDATE orders SET started_at = NULL WHERE id = $1', [req.params.id]);
    }

    await client.query('COMMIT');

    const order = await buildFullOrder(req.params.id as string);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Broadcast to all cleaners assigned to this order so every assigned
    // device reflects the new status immediately (e.g. in-progress).
    const assignedRes = await pool.query(
      `SELECT u.id FROM users u
       JOIN assigned_employees ae ON ae.employee_name = u.name
       WHERE ae.order_id = $1`,
      [req.params.id]
    );
    const assignedUserIds: string[] = assignedRes.rows.map((r: any) => r.id as string);
    broadcastToUsers('order:updated', order, assignedUserIds);

    res.json(order);
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('PATCH /orders/:id/status error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─── PATCH /api/orders/:id/sections/:sectionId/complete — mark all todos done ─
ordersRouter.patch('/:id/sections/:sectionId/complete', async (req: Request, res: Response) => {
  try {
    await pool.query('UPDATE todos SET completed = true WHERE section_id = $1', [req.params.sectionId]);
    await pool.query('UPDATE sections SET completed = true WHERE id = $1', [req.params.sectionId]);
    const order = await buildFullOrder(req.params.id as string);
    broadcast('order:updated', order);
    res.json(order);
  } catch (err: any) {
    console.error('PATCH section complete error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/orders/:id/sections/:sectionId/uncomplete — uncheck all todos ─
ordersRouter.patch('/:id/sections/:sectionId/uncomplete', async (req: Request, res: Response) => {
  try {
    await pool.query('UPDATE todos SET completed = false WHERE section_id = $1', [req.params.sectionId]);
    await pool.query('UPDATE sections SET completed = false WHERE id = $1', [req.params.sectionId]);
    const order = await buildFullOrder(req.params.id as string);
    broadcast('order:updated', order);
    res.json(order);
  } catch (err: any) {
    console.error('PATCH section uncomplete error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/orders/:id/todos/:todoId — toggle a single todo ────────────
ordersRouter.patch('/:id/todos/:todoId', async (req: Request, res: Response) => {
  try {
    const { completed } = req.body;

    if (typeof completed !== 'boolean') {
      return res.status(400).json({ error: 'completed (boolean) is required' });
    }
    await pool.query(
      'UPDATE todos SET completed = $1 WHERE id = $2',
      [completed, req.params.todoId]
    );

    // Also update section.completed if all todos in that section are done
    await pool.query(`
      UPDATE sections SET completed = (
        SELECT bool_and(completed) FROM todos WHERE section_id = sections.id
      )
      WHERE id = (SELECT section_id FROM todos WHERE id = $1)
    `, [req.params.todoId]);

    const order = await buildFullOrder(req.params.id as string);
    broadcast('order:updated', order);
    res.json(order);
  } catch (err: any) {
    console.error('PATCH todo error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/orders/:id/addons/:addonId — toggle a single add-on ────────
ordersRouter.patch('/:id/addons/:addonId', async (req: Request, res: Response) => {
  try {
    await pool.query(
      'UPDATE add_ons SET selected = NOT selected WHERE id = $1',
      [req.params.addonId]
    );
    const order = await buildFullOrder(req.params.id as string);
    broadcast('order:updated', order);
    res.json(order);
  } catch (err: any) {
    console.error('PATCH addon error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/orders/:id/sections/:sectionId/photos ────────────────────────
// Authenticated — upload a before/after photo for a section.
// Accepts multipart/form-data field "photo" + query param "type" ('before'|'after').
ordersRouter.post(
  '/:id/sections/:sectionId/photos',
  authenticate,
  photoUpload.single('photo'),
  async (req: Request, res: Response) => {
    try {
      const { id: orderId, sectionId } = req.params as { id: string; sectionId: string };
      const type = (req.query.type ?? req.body?.type) as string | undefined;

      if (!req.file) {
        return res.status(400).json({ error: 'No photo file uploaded' });
      }
      if (type !== 'before' && type !== 'after') {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'type must be "before" or "after"' });
      }

      // Verify the section belongs to the given order
      const sectionCheck = await pool.query(
        'SELECT id FROM sections WHERE id = $1 AND order_id = $2',
        [sectionId, orderId]
      );
      if (sectionCheck.rows.length === 0) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: 'Section not found for this order' });
      }

      const host = req.get('host') ?? 'localhost:3001';
      const protocol = req.protocol ?? 'http';
      const url = `${protocol}://${host}/uploads/photos/${req.file.filename}`;

      const result = await pool.query(
        `INSERT INTO photos (section_id, type, url) VALUES ($1, $2, $3)
         RETURNING id, section_id, type, url`,
        [sectionId, type, url]
      );

      const photo = result.rows[0];

      const fullOrder = await buildFullOrder(orderId);
      broadcast('order:updated', fullOrder);

      res.status(201).json(photo);
    } catch (err: any) {
      // Clean up uploaded file on any DB/validation error
      if (req.file?.path) {
        try { fs.unlinkSync(req.file.path); } catch { /* ignore */ }
      }
      console.error('POST section photo error:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ─── DELETE /api/orders/:id/sections/:sectionId/photos ──────────────────────
// Authenticated — delete a photo by its server URL (passed as ?url= query param).
// Removes the DB row and the file from disk.
ordersRouter.delete(
  '/:id/sections/:sectionId/photos',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id: orderId, sectionId } = req.params as { id: string; sectionId: string };
      const { url } = req.query;

      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'url query param is required' });
      }

      // Verify section belongs to this order
      const sectionCheck = await pool.query(
        'SELECT id FROM sections WHERE id = $1 AND order_id = $2',
        [sectionId, orderId]
      );
      if (sectionCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Section not found for this order' });
      }

      // Look up photo by section_id + url
      const photoRes = await pool.query(
        'SELECT id, url FROM photos WHERE section_id = $1 AND url = $2',
        [sectionId, url]
      );
      if (photoRes.rows.length === 0) {
        return res.status(404).json({ error: 'Photo not found' });
      }

      const photo = photoRes.rows[0];

      // Delete DB row
      await pool.query('DELETE FROM photos WHERE id = $1', [photo.id]);

      // Delete file from disk — extract filename safely
      const filename = (photo.url as string).split('/uploads/photos/').pop();
      if (filename) {
        const filePath = path.join(photosUploadDir, filename);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch { /* ignore stale files */ }
        }
      }

      const fullOrder = await buildFullOrder(orderId);
      broadcast('order:updated', fullOrder);

      res.json({ success: true });
    } catch (err: any) {
      console.error('DELETE section photo error:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ─── DELETE /api/orders/:id — delete an order ───────────────────────────────
ordersRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    broadcast('order:deleted', { id: req.params.id });
    res.json({ deleted: true, id: req.params.id });
  } catch (err: any) {
    console.error('DELETE /orders/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});
