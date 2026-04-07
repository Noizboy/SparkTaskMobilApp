import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { broadcast } from '../sse';

export const ordersRouter = Router();

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
    const { status, from, to, search } = req.query;

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
    const order = await buildFullOrder(req.params.id);
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
    const orderId = req.params.id;

    const {
      orderNumber, clientName, clientEmail, address, phone,
      status, date, time, serviceType,
      specialInstructions, accessInfo, goal,
      startedAt, completedAt,
      sections, addOns, assignedEmployees,
    } = req.body;

    // Auto-calculate duration from sections if provided, otherwise keep existing
    const existing = sections ? null : await client.query('SELECT duration FROM orders WHERE id = $1', [orderId]);
    const totalMinutes: number = sections ? sections.reduce((sum: number, s: any) => sum + (Number(s.estimatedTime) || 0), 0) : 0;
    const duration: string = sections
      ? (totalMinutes <= 0 ? '' : (() => { const h = Math.floor(totalMinutes / 60); const m = totalMinutes % 60; return h > 0 && m > 0 ? `${h} ${h === 1 ? 'hour' : 'hours'} ${m} min` : h > 0 ? `${h} ${h === 1 ? 'hour' : 'hours'}` : `${m} min`; })())
      : (existing?.rows[0]?.duration ?? '');

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

    // Replace sections if provided
    if (sections) {
      await client.query('DELETE FROM sections WHERE order_id = $1', [orderId]);

      for (let i = 0; i < sections.length; i++) {
        const s = sections[i];
        const sectionRes = await client.query(
          `INSERT INTO sections (order_id, name, icon, completed, skip_reason, estimated_time, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
          [orderId, s.name, s.icon || 'Sparkles', s.completed || false, s.skipReason, s.estimatedTime, i]
        );
        const sectionId = sectionRes.rows[0].id;

        if (s.todos) {
          for (let j = 0; j < s.todos.length; j++) {
            await client.query(
              `INSERT INTO todos (section_id, text, completed, sort_order) VALUES ($1,$2,$3,$4)`,
              [sectionId, s.todos[j].text, s.todos[j].completed || false, j]
            );
          }
        }

        // Re-insert photos
        if (s.beforePhotos) {
          for (const url of s.beforePhotos) {
            await client.query(
              `INSERT INTO photos (section_id, type, url) VALUES ($1,'before',$2)`,
              [sectionId, url]
            );
          }
        }
        if (s.afterPhotos) {
          for (const url of s.afterPhotos) {
            await client.query(
              `INSERT INTO photos (section_id, type, url) VALUES ($1,'after',$2)`,
              [sectionId, url]
            );
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

    // Replace employees if provided
    if (assignedEmployees) {
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
    res.json(fullOrder);
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('PUT /orders/:id error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─── PATCH /api/orders/:id/status — change status only ─────────────────────
ordersRouter.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, startedAt, completedAt } = req.body;
    const toMs = (v: any) => v == null ? null : typeof v === 'number' ? v : new Date(v).getTime();

    await pool.query(
      `UPDATE orders SET status=$1, started_at=COALESCE($2, started_at), completed_at=COALESCE($3, completed_at), updated_at=NOW() WHERE id=$4`,
      [status, toMs(startedAt), toMs(completedAt), req.params.id]
    );

    // Reset all progress when reverting to scheduled
    if (status === 'scheduled') {
      const sectionsRes = await pool.query('SELECT id FROM sections WHERE order_id = $1', [req.params.id]);
      for (const section of sectionsRes.rows) {
        await pool.query('UPDATE todos SET completed = false WHERE section_id = $1', [section.id]);
        await pool.query('DELETE FROM photos WHERE section_id = $1', [section.id]);
      }
      await pool.query('UPDATE sections SET completed = false, skip_reason = NULL WHERE order_id = $1', [req.params.id]);
      await pool.query('UPDATE add_ons SET selected = false WHERE order_id = $1', [req.params.id]);
      await pool.query('UPDATE orders SET started_at = NULL WHERE id = $1', [req.params.id]);
    }

    const order = await buildFullOrder(req.params.id);
    broadcast('order:updated', order);
    res.json(order);
  } catch (err: any) {
    console.error('PATCH /orders/:id/status error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/orders/:id/sections/:sectionId/complete — mark all todos done ─
ordersRouter.patch('/:id/sections/:sectionId/complete', async (req: Request, res: Response) => {
  try {
    await pool.query('UPDATE todos SET completed = true WHERE section_id = $1', [req.params.sectionId]);
    await pool.query('UPDATE sections SET completed = true WHERE id = $1', [req.params.sectionId]);
    const order = await buildFullOrder(req.params.id);
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
    const order = await buildFullOrder(req.params.id);
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
    // Toggle in DB — no need to trust the client's value
    await pool.query(
      'UPDATE todos SET completed = NOT completed WHERE id = $1',
      [req.params.todoId]
    );

    // Also update section.completed if all todos in that section are done
    await pool.query(`
      UPDATE sections SET completed = (
        SELECT bool_and(completed) FROM todos WHERE section_id = sections.id
      )
      WHERE id = (SELECT section_id FROM todos WHERE id = $1)
    `, [req.params.todoId]);

    const order = await buildFullOrder(req.params.id);
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
    const order = await buildFullOrder(req.params.id);
    broadcast('order:updated', order);
    res.json(order);
  } catch (err: any) {
    console.error('PATCH addon error:', err);
    res.status(500).json({ error: err.message });
  }
});

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
