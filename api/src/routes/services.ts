import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { broadcast } from '../sse';

export const servicesRouter = Router();

// ─── GET /api/services — list all services for the business ─────────────────
servicesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { business_id } = req.query;

    let query = 'SELECT * FROM services';
    const params: any[] = [];

    if (business_id) {
      query += ' WHERE business_id = $1';
      params.push(business_id);
    }

    query += ' ORDER BY name ASC';

    const result = await pool.query(query, params);
    res.json(result.rows.map(row => ({
      id: row.id,
      businessId: row.business_id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
    })));
  } catch (err: any) {
    console.error('GET /services error:', err.message);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// ─── GET /api/services/:id — get single service ────────────────────────────
servicesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM services WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      businessId: row.business_id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
    });
  } catch (err: any) {
    console.error('GET /services/:id error:', err.message);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

// ─── POST /api/services — create a service ──────────────────────────────────
servicesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, businessId } = req.body;

    if (!name || !businessId) {
      return res.status(400).json({ error: 'name and businessId are required' });
    }

    // Check for duplicate name within the same business
    const existing = await pool.query(
      'SELECT id FROM services WHERE business_id = $1 AND LOWER(name) = LOWER($2)',
      [businessId, name]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'A service with this name already exists' });
    }

    const result = await pool.query(
      `INSERT INTO services (name, description, business_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [name, description || null, businessId]
    );

    const row = result.rows[0];
    const service = {
      id: row.id,
      businessId: row.business_id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
    };

    broadcast('service:created', service);
    res.status(201).json(service);
  } catch (err: any) {
    console.error('POST /services error:', err.message);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// ─── PUT /api/services/:id — update a service ──────────────────────────────
servicesRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    // Check the service exists
    const current = await pool.query('SELECT * FROM services WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const businessId = current.rows[0].business_id;

    // Check for duplicate name within same business (excluding self)
    const dup = await pool.query(
      'SELECT id FROM services WHERE business_id = $1 AND LOWER(name) = LOWER($2) AND id != $3',
      [businessId, name, id]
    );
    if (dup.rows.length > 0) {
      return res.status(409).json({ error: 'A service with this name already exists' });
    }

    // Update the service name
    const oldName = current.rows[0].name;
    const result = await pool.query(
      `UPDATE services SET name = $1, description = $2 WHERE id = $3 RETURNING *`,
      [name, description || null, id]
    );

    // Also update any orders referencing the old service name
    if (oldName !== name) {
      await pool.query(
        'UPDATE orders SET service_type = $1 WHERE service_type = $2',
        [name, oldName]
      );
    }

    const row = result.rows[0];
    const service = {
      id: row.id,
      businessId: row.business_id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
    };

    broadcast('service:updated', service);
    res.json(service);
  } catch (err: any) {
    console.error('PUT /services/:id error:', err.message);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// ─── DELETE /api/services/:id — delete a service ────────────────────────────
servicesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if any orders reference this service
    const svc = await pool.query('SELECT name FROM services WHERE id = $1', [id]);
    if (svc.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const svcName = svc.rows[0].name;
    const ordersUsing = await pool.query(
      'SELECT COUNT(*) FROM orders WHERE service_type = $1',
      [svcName]
    );

    if (parseInt(ordersUsing.rows[0].count) > 0) {
      return res.status(409).json({
        error: `Cannot delete: ${ordersUsing.rows[0].count} order(s) use this service`,
      });
    }

    await pool.query('DELETE FROM services WHERE id = $1', [id]);

    broadcast('service:deleted', { id });
    res.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /services/:id error:', err.message);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});
