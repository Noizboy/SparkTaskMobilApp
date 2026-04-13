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
// ─── Server-side translations for push notification text ─────────────────────
type LangCode = 'en' | 'es' | 'pt' | 'zh';

const PUSH_STRINGS: Record<LangCode, {
  assignedTitle: string;
  assignedMessage: (orderNumber: string, date?: string, time?: string) => string;
  removedTitle: string;
  removedMessage: (orderNumber: string) => string;
}> = {
  en: {
    assignedTitle: 'New Job Assigned',
    assignedMessage: (n, d, t) => d && t
      ? `Order #${n} — ${d} at ${t} has been added to your schedule.`
      : `Order #${n} has been added to your schedule.`,
    removedTitle: 'Schedule Update',
    removedMessage: (n) => `You've been removed from Order #${n}. Check your schedule for any changes.`,
  },
  es: {
    assignedTitle: 'Nueva Orden Asignada',
    assignedMessage: (n, d, t) => d && t
      ? `La orden #${n} — ${d} a las ${t} ha sido agregada a tu horario.`
      : `La orden #${n} ha sido agregada a tu horario.`,
    removedTitle: 'Actualización de Horario',
    removedMessage: (n) => `Has sido removido de la orden #${n}. Revisa tu horario para ver los cambios.`,
  },
  pt: {
    assignedTitle: 'Nova Ordem Atribuída',
    assignedMessage: (n, d, t) => d && t
      ? `A ordem #${n} — ${d} às ${t} foi adicionada à sua agenda.`
      : `A ordem #${n} foi adicionada à sua agenda.`,
    removedTitle: 'Atualização de Agenda',
    removedMessage: (n) => `Você foi removido da ordem #${n}. Verifique sua agenda para ver as mudanças.`,
  },
  zh: {
    assignedTitle: '新任务已分配',
    assignedMessage: (n, d, t) => d && t
      ? `订单 #${n} — ${d} ${t} 已添加到您的日程。`
      : `订单 #${n} 已添加到您的日程。`,
    removedTitle: '日程更新',
    removedMessage: (n) => `您已从订单 #${n} 中被移除，请查看您的日程以了解变动。`,
  },
};

function getPushText(
  type: string,
  fallbackTitle: string,
  fallbackMessage: string,
  lang: LangCode,
  metadata?: Record<string, string>
): { title: string; body: string } {
  const strings = PUSH_STRINGS[lang] ?? PUSH_STRINGS.en;
  if (type === 'assigned' && metadata?.orderNumber) {
    return {
      title: strings.assignedTitle,
      body: strings.assignedMessage(metadata.orderNumber, metadata.date, metadata.time),
    };
  }
  if (type === 'removed' && metadata?.orderNumber) {
    return {
      title: strings.removedTitle,
      body: strings.removedMessage(metadata.orderNumber),
    };
  }
  return { title: fallbackTitle, body: fallbackMessage };
}

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
    const userRes = await pool.query('SELECT push_token, language FROM users WHERE id = $1', [userId]);
    const pushToken: string | null = userRes.rows[0]?.push_token ?? null;
    const lang: LangCode = (userRes.rows[0]?.language as LangCode) ?? 'en';

    if (pushToken && pushToken.startsWith('ExponentPushToken[')) {
      const { title: pushTitle, body: pushBody } = getPushText(type, title, message, lang, metadata);
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify({
          to: pushToken,
          title: pushTitle,
          body: pushBody,
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
