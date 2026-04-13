import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db';

export const notificationsRouter = Router();

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

function toNotif(row: any) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    metadata: row.metadata ?? null,
    isRead: row.is_read,
    time: row.created_at,
  };
}

// ─── GET /api/notifications — list all notifications for the authenticated user ─
notificationsRouter.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100',
      [userId]
    );
    res.json(result.rows.map(toNotif));
  } catch (err: any) {
    console.error('GET /notifications error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/notifications/:id/read — mark one as read ───────────────────
notificationsRouter.patch('/:id/read', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [req.params.id, userId]
    );
    res.json({ success: true });
  } catch (err: any) {
    console.error('PATCH /notifications/:id/read error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/notifications/read-all — mark all as read for user ───────────
notificationsRouter.patch('/read-all', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1',
      [userId]
    );
    res.json({ success: true });
  } catch (err: any) {
    console.error('PATCH /notifications/read-all error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/notifications — internal helper used by the orders route ───────
// Not authenticated — only called server-side by broadcastNotification helper.
// We export the helper directly instead of exposing an open HTTP endpoint.
export async function createNotificationForUser(
  userId: string,
  type: string,
  title: string,
  message: string,
  metadata?: Record<string, string>
): Promise<void> {
  await pool.query(
    'INSERT INTO notifications (user_id, type, title, message, metadata) VALUES ($1, $2, $3, $4, $5)',
    [userId, type, title, message, metadata ? JSON.stringify(metadata) : null]
  );

  // Send Expo push notification if the user has a registered push token
  try {
    const tokenRes = await pool.query('SELECT push_token FROM users WHERE id = $1', [userId]);
    const pushToken: string | null = tokenRes.rows[0]?.push_token ?? null;

    if (pushToken && pushToken.startsWith('ExponentPushToken[')) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify({
          to: pushToken,
          title,
          body: message,
          sound: 'default',
          data: { type },
        }),
      });
    }
  } catch (err) {
    // Non-critical — DB notification already saved, push failure shouldn't break the flow
    console.warn('[Push] Failed to send push notification to user', userId, err);
  }
}
